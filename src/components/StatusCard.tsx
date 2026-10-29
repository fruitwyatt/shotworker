import type { Status } from '../lib/useBgWorker';

interface Props {
  status: Status;
  warnings: string[];
  busy: boolean;
  onCancel: () => void;
  onRetry: () => void;
  idleHint?: string;
  doneLine?: string;
}

export default function StatusCard({
  status,
  warnings,
  busy,
  onCancel,
  onRetry,
  idleHint,
  doneLine,
}: Props) {
  return (
    <div className="status-card">
      {status.kind === 'idle' && idleHint ? (
        <p className="status-line muted">{idleHint}</p>
      ) : null}
      {status.kind === 'downloading' && (
        <>
          <p className="status-line">
            Preparing… {Math.round((status.loaded / Math.max(status.total, 1)) * 100)}%
          </p>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${(status.loaded / Math.max(status.total, 1)) * 100}%` }}
            />
          </div>
          <p className="status-sub muted">First use loads once, then it’s faster.</p>
        </>
      )}
      {status.kind === 'decoding' && <p className="status-line">Reading your file…</p>}
      {status.kind === 'processing' && (
        <>
          <p className="status-line">
            Removing background
            {status.total > 1 ? ` — ${status.current}/${status.total} frames` : '…'}
          </p>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${(status.current / Math.max(status.total, 1)) * 100}%` }}
            />
          </div>
        </>
      )}
      {status.kind === 'encoding' && <p className="status-line">Finishing up…</p>}
      {status.kind === 'done' && <p className="status-line ok">{doneLine ?? 'Done — ready to download.'}</p>}
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
    </div>
  );
}
