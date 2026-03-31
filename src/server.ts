import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import middie from '@fastify/middie';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const server = fastify({ logger: true });

  await server.register(middie);
  await server.register(cors);
  await server.register(fastifyWebsocket);

  // API Routes
  server.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // OpenClaw WebSocket Proxy
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

  // Vite Integration
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
