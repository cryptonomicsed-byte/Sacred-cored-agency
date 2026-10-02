const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

export async function generateVoice(params: {
  text: string;
  voiceId?: string;
}): Promise<Buffer> {
  const voiceId = params.voiceId || DEFAULT_VOICE_ID;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: params.text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('ElevenLabs error: ' + response.status);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

export async function getVoices(): Promise<{ voice_id: string; name: string }[]> {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error('ElevenLabs voices error: ' + response.status);
  }

  const data = await response.json();
  return (data.voices || [])
    .filter((v: any) => v.category === 'premade')
    .map((v: any) => ({ voice_id: v.voice_id, name: v.name }));
}
