const _BASE = 'https://ffmpeg-proxy.TU_SUBDOMINIO.workers.dev/?url=https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/';
const CORE_URL = `${_BASE}ffmpeg-core.js`;
const WASM_URL = `${_BASE}ffmpeg-core.wasm`;

export async function createFFmpeg(onProgress?: (pct: number) => void) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');
  const ff = new FFmpeg();
  if (onProgress) {
    ff.on('progress', ({ progress }: { progress: number; time: number }) =>
      onProgress(Math.min(99, Math.round(progress * 100))),
    );
  }
  try {
    await ff.load({
      coreURL: await toBlobURL(CORE_URL, 'text/javascript'),
      wasmURL: await toBlobURL(WASM_URL, 'application/wasm'),
    });
  } catch (err) {
    console.error('[FFmpeg] Error al cargar el motor WASM desde', CORE_URL, err);
    throw err;
  }
  return ff;
}

const MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  gif: 'image/gif',
};

export async function runFFmpeg(
  ff: Awaited<ReturnType<typeof createFFmpeg>>,
  inputFile: File,
  inputName: string,
  args: string[],
  outputName: string,
): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util');
  await ff.writeFile(inputName, await fetchFile(inputFile));
  try {
    await ff.exec(['-i', inputName, ...args, outputName]);
  } catch (err) {
    console.error('[FFmpeg] exec falló. Comando:', ['-i', inputName, ...args, outputName], err);
    throw err;
  }
  const data = (await ff.readFile(outputName)) as Uint8Array;
  try { await ff.deleteFile(inputName); } catch { /* ignore */ }
  try { await ff.deleteFile(outputName); } catch { /* ignore */ }
  const ext = outputName.split('.').pop()!;
  return new Blob([data.buffer], { type: MIME[ext] ?? 'application/octet-stream' });
}
