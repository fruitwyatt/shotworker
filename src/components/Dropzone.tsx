import { useRef, useState } from 'react';

interface Props {
  accept: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  title: string;
  hint: string;
}

export default function Dropzone({ accept, disabled, onFile, title, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
      <button
        type="button"
        className={`dropzone${dragOver ? ' drag' : ''}`}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (!disabled && f) onFile(f);
        }}
      >
        <span className="dropzone-icon" aria-hidden>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4" />
            <path d="m6 10 6-6 6 6" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
        </span>
        <span className="dropzone-title">{title}</span>
        <span className="dropzone-hint">{hint}</span>
      </button>
    </>
  );
}
