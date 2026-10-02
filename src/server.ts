import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import middie from '@fastify/middie';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { generateJingle } from './services/lyriaService';
import { generateVoice, getVoices } from './services/elevenLabsService';
import { TOKEN_COSTS } from './lib/tokenCosts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Firebase Admin Init ---
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'studio-2927706276-2e2ac',
  });
}

const adminDb = admin.firestore();
adminDb.settings({ databaseId: 'ai-studio-875f5cb9-d0de-4622-9323-dd94492944e5' });

// --- Token Helpers ---

async function getUserTokens(userId: string): Promise<number> {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (!userDoc.exists) return 0;
  return userDoc.data()?.tokens ?? 0;
}

async function deductTokens(params: {
  userId: string;
  amount: number;
  action: string;
}): Promise<number> {
  const { userId, amount, action } = params;
  const userRef = adminDb.collection('users').doc(userId);

  return adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentTokens = userDoc.data()?.tokens ?? 0;
    if (currentTokens < amount) {
      throw new Error('Insufficient tokens');
    }

    const newBalance = currentTokens - amount;
    transaction.update(userRef, { tokens: newBalance });

    const auditRef = userRef.collection('auditLogs').doc();
    transaction.set(auditRef, {
      type: 'token_deduction',
      action,
      amount,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
    });

    return newBalance;
  });
}

async function checkTokens(params: {
  userId: string;
  required: number;
}): Promise<boolean> {
  const tokens = await getUserTokens(params.userId);
  return tokens >= params.required;
}

// --- Auth Middleware Helper ---

async function verifyAuth(request: any, reply: any): Promise<string | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    reply.status(401).send({ error: 'Invalid token' });
    return null;
  }
}

async function startServer() {
  const server = fastify({ logger: true });

  await server.register(middie);
  await server.register(cors);
  await server.register(fastifyWebsocket);

  // --- Health ---
  server.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // --- Token Routes ---

  server.get('/api/user/tokens', async (request, reply) => {
    const userId = await verifyAuth(request, reply);
    if (!userId) return;

    const tokens = await getUserTokens(userId);
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const tier = userDoc.data()?.userTier ?? 'free';

    return { tokens, tier };
  });

  server.post('/api/tokens/check', async (request, reply) => {
    const userId = await verifyAuth(request, reply);
    if (!userId) return;

    const { required, action } = request.body as { required: number; action: string };
    const hasSufficient = await checkTokens({ userId, required });

    if (!hasSufficient) {
      const currentTokens = await getUserTokens(userId);
      return reply.status(402).send({
        error: 'Insufficient tokens',
        required,
        action,
        balance: currentTokens,
      });
    }

    return { sufficient: true };
  });

  server.post('/api/tokens/deduct', async (request, reply) => {
    const userId = await verifyAuth(request, reply);
    if (!userId) return;

    const { amount, action } = request.body as { amount: number; action: string };

    try {
      const newBalance = await deductTokens({ userId, amount, action });
      return { tokensRemaining: newBalance };
    } catch (error: any) {
      if (error.message === 'Insufficient tokens') {
        return reply.status(402).send({
          error: 'Insufficient tokens',
          required: amount,
          action,
        });
      }
      throw error;
    }
  });

  // --- Audio Routes ---

  server.post('/api/audio/jingle', async (request, reply) => {
    const userId = await verifyAuth(request, reply);
    if (!userId) return;

    const cost = TOKEN_COSTS.JINGLE_GENERATION;
    const hasSufficient = await checkTokens({ userId, required: cost });
    if (!hasSufficient) {
      return reply.status(402).send({
        error: 'Insufficient tokens',
        required: cost,
        action: 'JINGLE_GENERATION',
      });
    }

    const { prompt, companyName, tone, type } = request.body as {
      prompt: string;
      companyName?: string;
      tone?: string;
      type: 'clip' | 'pro';
    };

    try {
      const audioBuffer = await generateJingle({ prompt, companyName, tone, type });
      const newBalance = await deductTokens({ userId, amount: cost, action: 'JINGLE_GENERATION' });

      return {
        audio: audioBuffer.toString('base64'),
        mimeType: 'audio/mpeg',
        tokensRemaining: newBalance,
      };
    } catch (error: any) {
      server.log.error('Jingle generation failed:', error);
      return reply.status(500).send({ error: error.message || 'Jingle generation failed' });
    }
  });

  server.post('/api/audio/voice', async (request, reply) => {
    const userId = await verifyAuth(request, reply);
    if (!userId) return;

    const cost = TOKEN_COSTS.VOICE_GENERATION;
    const hasSufficient = await checkTokens({ userId, required: cost });
    if (!hasSufficient) {
      return reply.status(402).send({
        error: 'Insufficient tokens',
        required: cost,
        action: 'VOICE_GENERATION',
      });
    }

    const { text, voiceId } = request.body as { text: string; voiceId?: string };

    try {
      const audioBuffer = await generateVoice({ text, voiceId });
      const newBalance = await deductTokens({ userId, amount: cost, action: 'VOICE_GENERATION' });

      return {
        audio: audioBuffer.toString('base64'),
        mimeType: 'audio/mpeg',
        tokensRemaining: newBalance,
      };
    } catch (error: any) {
      server.log.error('Voice generation failed:', error);
      return reply.status(500).send({ error: error.message || 'Voice generation failed' });
    }
  });

  server.get('/api/audio/voices', async (request, reply) => {
    const userId = await verifyAuth(request, reply);
    if (!userId) return;

    try {
      const voices = await getVoices();
      return { voices };
    } catch (error: any) {
      server.log.error('Voice list failed:', error);
      return reply.status(500).send({ error: error.message || 'Failed to fetch voices' });
    }
  });

  // --- OpenClaw WebSocket Proxy ---
  server.get('/ws/openclaw', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        server.log.info('OpenClaw Message:', data);

        connection.socket.send(JSON.stringify({
          type: 'log',
          source: 'SYSTEM',
          content: `Received command: ${data.command || 'unknown'}`,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        server.log.error('WS Parse Error:', e);
      }
    });
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    server.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    server.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });

    server.setNotFoundHandler((request, reply) => {
      reply.sendFile('index.html');
    });
  }

  const PORT = 3000;
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
