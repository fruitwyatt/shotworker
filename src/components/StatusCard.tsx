import type { Status } from '../lib/useBgWorker';

function fmtMB(n: number) {
  return (n / 1024 / 1024).toFixed(1);
}

interface Props {
  status: Status;
  warnings: string[];
  backend: string | null;
  busy: boolean;
  onCancel: () => void;
  onRetry: () => void;
  idleHint: string;
  doneLine?: string;
}

export default function StatusCard({
  status,
  warnings,
  backend,
  busy,
  onCancel,
  onRetry,
  idleHint,
  doneLine,
}: Props) {
  return (
    <div className="status-card">
      {status.kind === 'idle' && <p className="status-line muted">{idleHint}</p>}
      {status.kind === 'downloading' && (
        <>
          <p className="status-line">
            Downloading AI model… {fmtMB(status.loaded)} / {fmtMB(status.total)} MB (
            {Math.round((status.loaded / status.total) * 100)}%)
          </p>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${(status.loaded / status.total) * 100}%` }}
            />
          </div>
          <p className="status-sub muted">One-time ~94 MB download, cached by your browser.</p>
        </>
      )}
      {status.kind === 'decoding' && <p className="status-line">Decoding…</p>}
      {status.kind === 'processing' && (
        <>
          <p className="status-line">
            Removing background — {status.current}/{status.total}
            {status.total > 1 ? ' frames' : ''}
          </p>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${(status.current / status.total) * 100}%` }}
            />
          </div>
        </>
      )}
      {status.kind === 'encoding' && <p className="status-line">Encoding result…</p>}
      {status.kind === 'done' && <p className="status-line ok">{doneLine ?? 'Done.'}</p>}
      {status.kind === 'error' && (
        <p className="status-line error">
          {status.message}{' '}
          {status.retriable && (
            <button className="btn btn-small" onClick={onRetry}>
              Retry
            </button>
          )}
        </p>
      )}
      {warnings.map((w, i) => (
        <p className="status-line warn" key={i}>
          {w}
        </p>
      ))}
      {busy && (
        <button className="btn btn-ghost btn-small" onClick={onCancel}>
          Cancel
        </button>
      )}
      {backend && status.kind !== 'done' && (
        <p className="status-sub muted">Engine: {backend}</p>
      )}
    </div>
  );
}
