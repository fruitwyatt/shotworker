import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBgWorker } from '../lib/useBgWorker';
import type { WorkerInMessage, WorkerOutMessage } from '../worker/protocol';
import { MAX_FILE_BYTES, MAX_SIDE, DEFAULT_BG } from '../worker/protocol';
import { usePageMeta } from '../lib/meta';
import { track } from '../lib/analytics';
import Dropzone from '../components/Dropzone';
import StatusCard from '../components/StatusCard';
import Faq from '../components/Faq';

const TOOL = 'image';

type Tab = 'png' | 'color';

interface Result {
  pngUrl: string | null;
  colorPngUrl: string | null;
  width: number;
  height: number;
  backend: string;
  alreadyTransparent: boolean;
}

function makeUrl(buf: ArrayBuffer | null, type: string): string | null {
  return buf ? URL.createObjectURL(new Blob([buf], { type })) : null;
}

function fmtMB(n: number) {
  return (n / 1024 / 1024).toFixed(1);
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/bmp'];

const FAQ = [
  {
    q: 'How do I remove a photo background for free?',
    a: 'Drop a PNG, JPG or WebP above. ShotWorker separates the subject from the background in your browser so you can download a transparent PNG — no signup, no watermark.',
  },
  {
    q: 'Is this good enough for product photos?',
    a: 'Yes — soft edges like fabric, hair, glass and packaging detail are preserved far better than magic-wand or chroma-key tools.',
  },
  {
    q: 'Are my photos uploaded anywhere?',
    a: 'No. Everything runs on your device. Your photos never leave your machine. The first run may take a moment to prepare; later runs are faster.',
  },
  {
    q: 'Why is the result 512px?',
    a: `The free in-browser pipeline caps the longest side at ${MAX_SIDE}px so it runs fast on any device. Larger images are downscaled automatically — higher-resolution output is on the roadmap.`,
  },
];

export default function ImageTool() {
  usePageMeta(
    'Image Background Remover — Free Transparent PNG',
    'Remove image backgrounds free with AI. Upload a product photo and download a transparent PNG — runs entirely in your browser, private, no signup.',
  );

  const [result, setResult] = useState<Result | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('png');
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [recoloring, setRecoloring] = useState(false);
  const recolorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFile = useRef<{ buf: ArrayBuffer; name: string; mime: string; size: number } | null>(
    null,
  );

  const onImageDone = useCallback(
    (msg: Extract<WorkerOutMessage, { type: 'image-done' }>) => {
      setResult({
        pngUrl: makeUrl(msg.png, 'image/png'),
        colorPngUrl: makeUrl(msg.colorPng, 'image/png'),
        width: msg.width,
        height: msg.height,
        backend: msg.backend,
        alreadyTransparent: msg.alreadyTransparent,
      });
      track('process_success', {
        tool: TOOL,
        width: msg.width,
        height: msg.height,
        backend: msg.backend,
        already_transparent: msg.alreadyTransparent,
      });
    },
    [],
  );

  const onImageRecolorDone = useCallback((png: ArrayBuffer) => {
    const url = makeUrl(png, 'image/png');
    setResult((prev) => {
      if (prev?.colorPngUrl) URL.revokeObjectURL(prev.colorPngUrl);
      return prev ? { ...prev, colorPngUrl: url } : prev;
    });
    setRecoloring(false);
  }, []);

  const { workerRef, status, setStatus, warnings, resetWarnings, cancel } =
    useBgWorker({ onImageDone, onImageRecolorDone });

  const busy =
    status.kind === 'decoding' || status.kind === 'processing' || status.kind === 'encoding';

  const send = useCallback(
    (buf: ArrayBuffer, name: string, mime: string) => {
      setStatus({ kind: 'decoding' });
      workerRef.current?.postMessage({
        type: 'process-image',
        file: buf,
        fileName: name,
        mime,
      } satisfies WorkerInMessage);
    },
    [workerRef, setStatus],
  );

  const onPick = useCallback(
    async (file: File) => {
      resetWarnings();
      setResult((old) => {
        if (old) {
          [old.pngUrl, old.colorPngUrl].forEach((u) => u && URL.revokeObjectURL(u));
        }
        return null;
      });
      setTab('png');
      setBgColor(DEFAULT_BG);
      setRecoloring(false);
      track('upload', { tool: TOOL, size_bytes: file.size, mime: file.type || 'unknown' });

      const okType =
        ACCEPTED.includes(file.type) || /\.(png|jpe?g|webp|avif|bmp)$/i.test(file.name);
      if (!okType) {
        track('process_fail', { tool: TOOL, reason: 'unsupported_type', mime: file.type || 'unknown' });
        setStatus({
          kind: 'error',
          message: 'Please pick a PNG, JPG, WebP or AVIF image.',
          retriable: false,
        });
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        track('limit_exceeded', { tool: TOOL, reason: 'file_too_large', size_bytes: file.size });
        setStatus({
          kind: 'error',
          message: `File is ${fmtMB(file.size)} MB — max is 8 MB.`,
          retriable: false,
        });
        return;
      }

      setOriginalUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      const buf = await file.arrayBuffer();
      const mime = file.type || 'image/png';
      pendingFile.current = { buf, name: file.name, mime, size: file.size };
      track('process_start', { tool: TOOL, size_bytes: file.size });
      send(buf, file.name, mime);
    },
    [send, setStatus, resetWarnings],
  );

  const onRetry = useCallback(() => {
    if (pendingFile.current) {
      const { buf, name, mime, size } = pendingFile.current;
      track('process_start', { tool: TOOL, size_bytes: size, retry: true });
      send(buf, name, mime);
    } else {
      setStatus({ kind: 'idle' });
    }
  }, [send, setStatus]);

  const onStartOver = useCallback(() => {
    [originalUrl, result?.pngUrl, result?.colorPngUrl].forEach((u) => {
      if (u) URL.revokeObjectURL(u);
    });
    setOriginalUrl(null);
    setResult(null);
    resetWarnings();
    setStatus({ kind: 'idle' });
    setTab('png');
    setBgColor(DEFAULT_BG);
    setRecoloring(false);
    pendingFile.current = null;
  }, [originalUrl, result, setStatus, resetWarnings]);

  const onColorChange = useCallback(
    (hex: string) => {
      setBgColor(hex);
      if (recolorTimer.current) clearTimeout(recolorTimer.current);
      recolorTimer.current = setTimeout(() => {
        setRecoloring(true);
        workerRef.current?.postMessage(
          { type: 'recolor-image', color: hex } satisfies WorkerInMessage,
        );
      }, 200);
    },
    [workerRef],
  );

  const previewUrl = result ? (tab === 'png' ? result.pngUrl : result.colorPngUrl) : null;

  return (
    <div className="wrap tool-page">
      <nav className="crumbs">
        <Link to="/">Home</Link> / <span>Tools</span> / <span>Image Background Remover</span>
      </nav>
      <h1>Image Background Remover</h1>
      <p className="tool-sub">
        Upload a product photo and get a clean transparent PNG with soft, studio-quality
        edges. Free, private, no signup.
      </p>
      <p className="limits-line">
        Limits: ≤ {fmtMB(MAX_FILE_BYTES)} MB · longest side ≤ {MAX_SIDE}px (auto-downscaled)
        · PNG, JPG, WebP, AVIF
      </p>

      <Dropzone
        accept="image/png,image/jpeg,image/webp,image/avif,image/bmp,.png,.jpg,.jpeg,.webp,.avif"
        disabled={busy}
        onFile={onPick}
        title="Drop a product photo, or click to choose"
        hint="PNG · JPG · WebP · AVIF · up to 8 MB · private on your device"
      />

      <StatusCard
        status={status}
        warnings={warnings}
        busy={busy}
        onCancel={() => {
          cancel();
          track('process_fail', { tool: TOOL, reason: 'cancelled' });
        }}
        onRetry={onRetry}
        idleHint="Drop a product photo, or click to choose"
        doneLine={
          result
            ? `Done — ${result.width}×${result.height}`
            : 'Done — ready to download.'
        }
      />

      {(originalUrl || result) && (
        <div className="preview-row">
          <figure className="preview-box">
            <figcaption>Original</figcaption>
            <div className="checker">{originalUrl && <img src={originalUrl} alt="Original" />}</div>
          </figure>
          <figure className="preview-box">
            <figcaption>Result</figcaption>
            <div className="checker">
              {result && previewUrl && (
                <img src={previewUrl} alt="Background removed" key={previewUrl} />
              )}
            </div>
          </figure>
        </div>
      )}

      {result && (
        <div className="output-card">
          <div className="tabs">
            <button className={`tab${tab === 'png' ? ' active' : ''}`} onClick={() => setTab('png')}>
              Transparent PNG
            </button>
            <button
              className={`tab${tab === 'color' ? ' active' : ''}`}
              onClick={() => setTab('color')}
            >
              Color Background
            </button>
          </div>
          <p className="tab-hint muted">
            {tab === 'png'
              ? 'Full soft alpha — drops cleanly onto any storefront theme.'
              : 'Opaque PNG composited on a solid color you pick.'}
          </p>

          {tab === 'color' && (
            <div className="color-row">
              <label htmlFor="img-bg-color">Background</label>
              <input
                id="img-bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => onColorChange(e.target.value)}
              />
              <code>{bgColor}</code>
              {recoloring && <span className="muted">re-encoding…</span>}
            </div>
          )}

          <div className="downloads">
            {previewUrl && (
              <a
                href={previewUrl}
                download={tab === 'png' ? 'shotworker-transparent.png' : 'shotworker-background.png'}
                onClick={() =>
                  track('download', { tool: TOOL, format: tab === 'png' ? 'png' : 'color-png' })
                }
              >
                <button className="btn btn-primary">
                  Download {tab === 'png' ? 'transparent PNG' : 'PNG'}
                </button>
              </a>
            )}
            <button className="btn btn-ghost" onClick={onStartOver}>
              Start over
            </button>
          </div>
        </div>
      )}

      <section className="section tool-faq">
        <h2 className="section-title">Image background removal — FAQ</h2>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}
