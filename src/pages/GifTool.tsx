import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBgWorker } from '../lib/useBgWorker';
import type { WorkerInMessage, WorkerOutMessage } from '../worker/protocol';
import { MAX_FILE_BYTES, MAX_FRAMES, MAX_SIDE, DEFAULT_BG } from '../worker/protocol';
import { usePageMeta } from '../lib/meta';
import { track } from '../lib/analytics';
import Dropzone from '../components/Dropzone';
import StatusCard from '../components/StatusCard';
import Faq from '../components/Faq';

const TOOL = 'gif';

type Tab = 'apng' | 'gif' | 'color' | 'webp';

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'apng', label: 'Transparent APNG', hint: 'Best quality — full soft alpha, plays everywhere GIF does.' },
  { key: 'gif', label: 'Transparent GIF', hint: '1-bit alpha only — soft edges look jagged. Use APNG when you can.' },
  { key: 'color', label: 'Color Background', hint: 'Opaque GIF composited on a solid color you pick.' },
  { key: 'webp', label: 'Animated WebP', hint: 'Small file with soft alpha — for modern browsers & web use.' },
];

interface Result {
  apngUrl: string | null;
  gifUrl: string | null;
  colorGifUrl: string | null;
  webpUrl: string | null;
  width: number;
  height: number;
  frameCount: number;
  backend: string;
  alreadyTransparent: boolean;
}

function makeUrl(buf: ArrayBuffer | null, type: string): string | null {
  return buf ? URL.createObjectURL(new Blob([buf], { type })) : null;
}

function fmtMB(n: number) {
  return (n / 1024 / 1024).toFixed(1);
}

const FAQ = [
  {
    q: 'How do I remove the background from a GIF?',
    a: 'Drop your GIF into the tool above. ShotWorker decodes every frame, runs an AI matting model locally in your browser, and re-encodes the result as a transparent APNG, GIF or WebP.',
  },
  {
    q: 'Why APNG instead of GIF?',
    a: 'GIF transparency is 1-bit — pixels are either fully opaque or fully transparent, which makes soft edges (hair, shadows, glass) look jagged. APNG keeps full 8-bit alpha and plays anywhere a GIF does.',
  },
  {
    q: 'Is there a size limit?',
    a: `Yes — up to 8 MB, ${MAX_FRAMES} frames and ${MAX_SIDE}px on the longest side. Longer GIFs are truncated with a warning, and larger dimensions are downscaled automatically.`,
  },
  {
    q: 'Are my GIFs uploaded?',
    a: 'No. The model is downloaded to your browser once and everything runs on your device. Your file is never sent to our servers.',
  },
];

export default function GifTool() {
  usePageMeta(
    'GIF Background Remover — Free, In-Browser',
    'Remove backgrounds from animated GIFs free with AI. Export transparent APNG, GIF or WebP — runs entirely in your browser, no uploads, no signup.',
  );

  const [result, setResult] = useState<Result | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('apng');
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [recoloring, setRecoloring] = useState(false);
  const recolorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFile = useRef<{ buf: ArrayBuffer; name: string; size: number } | null>(null);

  const onDone = useCallback(
    (msg: Extract<WorkerOutMessage, { type: 'done' }>) => {
      setResult({
        apngUrl: makeUrl(msg.apng, 'image/png'),
        gifUrl: makeUrl(msg.gif, 'image/gif'),
        colorGifUrl: makeUrl(msg.colorGif, 'image/gif'),
        webpUrl: makeUrl(msg.webp, 'image/webp'),
        width: msg.width,
        height: msg.height,
        frameCount: msg.frameCount,
        backend: msg.backend,
        alreadyTransparent: msg.alreadyTransparent,
      });
      track('process_success', {
        tool: TOOL,
        frames: msg.frameCount,
        width: msg.width,
        height: msg.height,
        backend: msg.backend,
        already_transparent: msg.alreadyTransparent,
      });
    },
    [],
  );

  const onRecolorDone = useCallback((gif: ArrayBuffer) => {
    const url = makeUrl(gif, 'image/gif');
    setResult((prev) => {
      if (prev?.colorGifUrl) URL.revokeObjectURL(prev.colorGifUrl);
      return prev ? { ...prev, colorGifUrl: url } : prev;
    });
    setRecoloring(false);
  }, []);

  const { workerRef, status, setStatus, warnings, resetWarnings, backend, cancel } =
    useBgWorker({ onDone, onRecolorDone });

  const busy =
    status.kind === 'decoding' ||
    status.kind === 'processing' ||
    status.kind === 'encoding';

  const onPick = useCallback(
    async (file: File) => {
      resetWarnings();
      setResult((old) => {
        if (old) {
          [old.apngUrl, old.gifUrl, old.colorGifUrl, old.webpUrl].forEach((u) => {
            if (u) URL.revokeObjectURL(u);
          });
        }
        return null;
      });
      setTab('apng');
      setBgColor(DEFAULT_BG);
      setRecoloring(false);
      track('upload', { tool: TOOL, size_bytes: file.size });

      if (file.type !== 'image/gif' && !file.name.toLowerCase().endsWith('.gif')) {
        track('process_fail', { tool: TOOL, reason: 'not_a_gif' });
        setStatus({ kind: 'error', message: 'Please pick a GIF file.', retriable: false });
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
      pendingFile.current = { buf, name: file.name, size: file.size };
      setStatus({ kind: 'decoding' });
      track('process_start', { tool: TOOL, size_bytes: file.size });
      workerRef.current?.postMessage({
        type: 'process',
        file: buf,
        fileName: file.name,
      } satisfies WorkerInMessage);
    },
    [workerRef, setStatus, resetWarnings],
  );

  const onRetry = useCallback(() => {
    if (pendingFile.current) {
      setStatus({ kind: 'decoding' });
      track('process_start', { tool: TOOL, size_bytes: pendingFile.current.size, retry: true });
      workerRef.current?.postMessage({
        type: 'process',
        file: pendingFile.current.buf,
        fileName: pendingFile.current.name,
      } satisfies WorkerInMessage);
    } else {
      workerRef.current?.postMessage({ type: 'warmup' } satisfies WorkerInMessage);
      setStatus({ kind: 'idle' });
    }
  }, [workerRef, setStatus]);

  const onStartOver = useCallback(() => {
    [originalUrl, result?.apngUrl, result?.gifUrl, result?.colorGifUrl, result?.webpUrl].forEach(
      (u) => {
        if (u) URL.revokeObjectURL(u);
      },
    );
    setOriginalUrl(null);
    setResult(null);
    resetWarnings();
    setStatus({ kind: 'idle' });
    setTab('apng');
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
        workerRef.current?.postMessage({ type: 'recolor', color: hex } satisfies WorkerInMessage);
      }, 200);
    },
    [workerRef],
  );

  const previewUrl = result
    ? tab === 'gif'
      ? result.gifUrl
      : tab === 'color'
        ? result.colorGifUrl
        : tab === 'webp'
          ? result.webpUrl
          : (result.apngUrl ?? result.webpUrl)
    : null;
  const downloadName =
    tab === 'gif'
      ? 'shotworker-transparent.gif'
      : tab === 'color'
        ? 'shotworker-background.gif'
        : tab === 'webp'
          ? 'shotworker-transparent.webp'
          : 'shotworker-transparent.png';

  const tabUrl: Record<Tab, string | null> | null = result
    ? {
        apng: result.apngUrl ?? result.webpUrl,
        gif: result.gifUrl,
        color: result.colorGifUrl,
        webp: result.webpUrl,
      }
    : null;

  return (
    <div className="wrap tool-page">
      <nav className="crumbs">
        <Link to="/">Home</Link> / <span>Tools</span> / <span>GIF Background Remover</span>
      </nav>
      <h1>GIF Background Remover</h1>
      <p className="tool-sub">
        Remove the background from animated GIFs with AI — export transparent APNG, GIF
        or WebP. Free, in-browser, no signup.
      </p>
      <p className="limits-line">
        Limits: ≤ {fmtMB(MAX_FILE_BYTES)} MB · ≤ {MAX_FRAMES} frames (longer GIFs are
        truncated) · longest side ≤ {MAX_SIDE}px (auto-downscaled)
      </p>

      <Dropzone
        accept="image/gif,.gif"
        disabled={busy}
        onFile={onPick}
        title="Drop your GIF here — or click to browse"
        hint="GIF up to 8 MB · processed on your device, never uploaded"
      />

      <StatusCard
        status={status}
        warnings={warnings}
        backend={backend}
        busy={busy}
        onCancel={() => {
          cancel();
          track('process_fail', { tool: TOOL, reason: 'cancelled' });
        }}
        onRetry={onRetry}
        idleHint="Pick a GIF to start. The ~94 MB matting model downloads once and is cached by your browser."
        doneLine={
          result
            ? `Done — ${result.frameCount} frames, ${result.width}×${result.height}, engine: ${result.backend}`
            : 'Done.'
        }
      />

      {(originalUrl || result) && (
        <div className="preview-row">
          <figure className="preview-box">
            <figcaption>Original</figcaption>
            <div className="checker">{originalUrl && <img src={originalUrl} alt="Original GIF" />}</div>
          </figure>
          <figure className="preview-box">
            <figcaption>Result</figcaption>
            <div className="checker">
              {result && previewUrl && <img src={previewUrl} alt="Background removed" key={previewUrl} />}
            </div>
          </figure>
        </div>
      )}

      {result && tabUrl && (
        <div className="output-card">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab${tab === t.key ? ' active' : ''}`}
                disabled={!tabUrl[t.key]}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="tab-hint muted">{TABS.find((t) => t.key === tab)?.hint}</p>

          {tab === 'color' && (
            <div className="color-row">
              <label htmlFor="bg-color">Background</label>
              <input
                id="bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => onColorChange(e.target.value)}
              />
              <code>{bgColor}</code>
              {recoloring && <span className="muted">re-encoding…</span>}
            </div>
          )}
          {tab === 'apng' && !result.apngUrl && result.webpUrl && (
            <p className="status-line warn">
              APNG encoding unavailable in this browser — showing animated WebP (still soft alpha).
            </p>
          )}

          <div className="downloads">
            {previewUrl && (
              <a
                href={previewUrl}
                download={downloadName}
                onClick={() => track('download', { tool: TOOL, format: tab })}
              >
                <button className="btn btn-primary">Download {TABS.find((t) => t.key === tab)?.label}</button>
              </a>
            )}
            {result.webpUrl && tab !== 'webp' && (
              <a
                href={result.webpUrl}
                download="shotworker-transparent.webp"
                onClick={() => track('download', { tool: TOOL, format: 'webp' })}
              >
                <button className="btn btn-outline">Download WebP</button>
              </a>
            )}
            <button className="btn btn-ghost" onClick={onStartOver}>
              Start over
            </button>
          </div>
        </div>
      )}

      <section className="section tool-faq">
        <h2 className="section-title">GIF background removal — FAQ</h2>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}
