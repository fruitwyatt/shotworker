// Messages exchanged between the main thread and the background-removal worker.

export type WorkerInMessage =
  // Optional warm (not used on page enter — model loads on first process*).
  | { type: 'warmup' }
  // Process a GIF file. `file` is the raw GIF bytes.
  | { type: 'process'; file: ArrayBuffer; fileName: string }
  // Process a single image (PNG/JPEG/WebP/AVIF — anything createImageBitmap
  // can decode). `file` is the raw encoded bytes.
  | { type: 'process-image'; file: ArrayBuffer; fileName: string; mime: string }
  // Re-encode the Color Background GIF for a new hex color using the cutouts
  // cached in the worker (no model re-run).
  | { type: 'recolor'; color: string }
  // Re-encode the color-background PNG for a new hex color using the cached
  // single-image cutout (no model re-run).
  | { type: 'recolor-image'; color: string };

export type WorkerOutMessage =
  | { type: 'model-progress'; loaded: number; total: number }
  | { type: 'model-state'; state: 'downloading' | 'ready'; backend?: string }
  | { type: 'phase'; phase: 'decoding' | 'encoding' }
  | { type: 'frame-progress'; current: number; total: number }
  | { type: 'warn'; text: string }
  | {
      type: 'done';
      /** Soft-alpha APNG bytes (image/png), or null if encoding failed. */
      apng: ArrayBuffer | null;
      /** 1-bit transparent GIF bytes, or null if encoding failed. */
      gif: ArrayBuffer | null;
      /** Opaque GIF composited on the default background color. */
      colorGif: ArrayBuffer | null;
      /** Soft-alpha animated WebP bytes, or null if encoding failed. */
      webp: ArrayBuffer | null;
      width: number;
      height: number;
      frameCount: number;
      backend: string;
      /** Source already had substantial transparency (model was skipped). */
      alreadyTransparent: boolean;
    }
  | {
      type: 'image-done';
      /** Soft-alpha PNG bytes, or null if encoding failed. */
      png: ArrayBuffer | null;
      /** Opaque PNG composited on the default background color. */
      colorPng: ArrayBuffer | null;
      width: number;
      height: number;
      backend: string;
      alreadyTransparent: boolean;
    }
  | { type: 'recolor-done'; gif: ArrayBuffer }
  | { type: 'image-recolor-done'; png: ArrayBuffer }
  | { type: 'error'; message: string; retriable: boolean };

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_FRAMES = 48;
export const MAX_SIDE = 512;
export const DEFAULT_BG = '#ffffff';
export const MODEL_URL =
  'https://huggingface.co/studioludens/birefnet-lite-512/resolve/962e67969ec6acec9c19fab76acee4f5e22e990c/onnx/model_fp16.onnx';
export const MODEL_BYTES = 98484532;
export const MODEL_SHA256 = 'eff9216bb2f9d3f023d9c2b7196845a7485739ab1f231593633e4d2344ffc516';
