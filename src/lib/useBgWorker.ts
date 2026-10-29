// Shared worker lifecycle for the background-removal tools: spawn on mount,
// status bookkeeping, cancel (terminate + respawn). The AI model is loaded
// lazily inside the worker on the first process/process-image message — never
// on page enter. Tool-specific result messages go to `handlers` callbacks.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkerOutMessage } from '../worker/protocol';

export type Status =
  | { kind: 'idle' }
  | { kind: 'downloading'; loaded: number; total: number }
  | { kind: 'decoding' }
  | { kind: 'processing'; current: number; total: number }
  | { kind: 'encoding' }
  | { kind: 'done' }
  | { kind: 'error'; message: string; retriable: boolean };

export interface WorkerHandlers {
  onDone?: (msg: Extract<WorkerOutMessage, { type: 'done' }>) => void;
  onImageDone?: (msg: Extract<WorkerOutMessage, { type: 'image-done' }>) => void;
  onRecolorDone?: (gif: ArrayBuffer) => void;
  onImageRecolorDone?: (png: ArrayBuffer) => void;
}

export function useBgWorker(handlers: WorkerHandlers) {
  const workerRef = useRef<Worker | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [backend, setBackend] = useState<string | null>(null);

  const handleMessage = useCallback((msg: WorkerOutMessage) => {
    const h = handlersRef.current;
    switch (msg.type) {
      case 'model-progress':
        setStatus({ kind: 'downloading', loaded: msg.loaded, total: msg.total });
        break;
      case 'model-state':
        if (msg.state === 'ready' && msg.backend) setBackend(msg.backend);
        break;
      case 'phase':
        setStatus({ kind: msg.phase });
        break;
      case 'frame-progress':
        setStatus({ kind: 'processing', current: msg.current, total: msg.total });
        break;
      case 'warn':
        setWarnings((w) => [...w, msg.text]);
        break;
      case 'done':
        h.onDone?.(msg);
        setStatus({ kind: 'done' });
        break;
      case 'image-done':
        h.onImageDone?.(msg);
        setStatus({ kind: 'done' });
        break;
      case 'recolor-done':
        h.onRecolorDone?.(msg.gif);
        break;
      case 'image-recolor-done':
        h.onImageRecolorDone?.(msg.png);
        break;
      case 'error':
        setStatus({ kind: 'error', message: msg.message, retriable: msg.retriable });
        break;
    }
  }, []);

  const spawnWorker = useCallback(() => {
    workerRef.current?.terminate();
    const w = new Worker(new URL('../worker/bg.worker.ts', import.meta.url), {
      type: 'module',
    });
    w.onmessage = (e: MessageEvent<WorkerOutMessage>) => handleMessage(e.data);
    w.onerror = (e) => {
      console.warn('[worker] onerror:', e.message);
      setStatus({ kind: 'error', message: 'Something went wrong — please try again.', retriable: true });
    };
    workerRef.current = w;
    return w;
  }, [handleMessage]);

  useEffect(() => {
    const w = spawnWorker();
    // Do NOT warmup/download the model on mount — wait for first file.
    return () => w.terminate();
  }, [spawnWorker]);

  /** Terminate the busy worker and respawn a fresh idle one (no model prefetch). */
  const cancel = useCallback(() => {
    spawnWorker();
    setStatus({ kind: 'idle' });
  }, [spawnWorker]);

  const resetWarnings = useCallback(() => setWarnings([]), []);

  return { workerRef, status, setStatus, warnings, resetWarnings, backend, cancel };
}
