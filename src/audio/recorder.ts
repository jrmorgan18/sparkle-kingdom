/** Parent voice recording with MediaRecorder. The child never records or speaks to the app. */

export type RecorderError = 'unsupported' | 'denied' | 'no-mic' | 'failed';

export interface ActiveRecording {
  /** Stops and returns the recorded audio. */
  stop: () => Promise<Blob>;
  cancel: () => void;
}

export function recordingSupported(): boolean {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

/** Safari records MP4/AAC; Chrome and Firefox record WebM/Opus. */
export function pickMimeType(): string | undefined {
  const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return candidates.find((m) => MediaRecorder.isTypeSupported?.(m));
}

export function errorKind(e: unknown): RecorderError {
  const name = (e as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  return 'failed';
}

export const MAX_CLIP_MS = 8000;

export async function startRecording(onAutoStop?: () => void): Promise<ActiveRecording> {
  if (!recordingSupported()) throw Object.assign(new Error('unsupported'), { kind: 'unsupported' as RecorderError });
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    throw Object.assign(new Error('mic'), { kind: errorKind(e) });
  }
  const mimeType = pickMimeType();
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
  const release = () => stream.getTracks().forEach((t) => t.stop());
  const stopped = new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      release();
      resolve(new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' }));
    };
  });
  rec.start();
  const auto = setTimeout(() => {
    if (rec.state === 'recording') {
      rec.stop();
      onAutoStop?.();
    }
  }, MAX_CLIP_MS);
  return {
    stop: () => {
      clearTimeout(auto);
      if (rec.state === 'recording') rec.stop();
      return stopped;
    },
    cancel: () => {
      clearTimeout(auto);
      rec.onstop = null;
      if (rec.state === 'recording') rec.stop();
      release();
    },
  };
}

export const RECORDER_MESSAGES: Record<RecorderError, string> = {
  unsupported: 'This browser can’t record audio. The game will use the built-in voice instead.',
  denied: 'Microphone access was not allowed. The game will keep using the built-in voice. To record, allow the microphone for this site in your browser settings, then try again.',
  'no-mic': 'No microphone was found. The game will keep using the built-in voice.',
  failed: 'Recording didn’t work this time. The game will keep using the built-in voice.',
};
