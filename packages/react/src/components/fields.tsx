import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Spring, resolveSpring } from '@vizzele/core';
import { cx, useIsomorphicLayoutEffect, useLatest } from '../hooks/utils';

// ——————————————————————————— OTP input ———————————————————————————

export interface OTPInputProps {
  /** Number of characters. Default 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called once every cell is filled. */
  onComplete?: (value: string) => void;
  /** Allowed characters. Default `numeric`. */
  type?: 'numeric' | 'alphanumeric';
  /** Draw a gap after every n cells, e.g. 3 → "123 456". */
  groupSize?: number;
  /** Show dots instead of characters. */
  mask?: boolean;
  /** Error state: the cells shake once and turn red. */
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible name. Default "One-time code". */
  label?: string;
  /** Submitted with forms. */
  name?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

const allowed = {
  numeric: /[^0-9]/g,
  alphanumeric: /[^0-9a-z]/gi,
};

/**
 * A one-time-code field: a drop of light slides to the next cell as you type (stretching on
 * the way), characters fall into place, and a full code sends an iridescent wave across.
 * One real input underneath, so paste, SMS autofill and screen readers just work.
 */
export function OTPInput({
  length = 6,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  type = 'numeric',
  groupSize,
  mask,
  invalid,
  disabled,
  autoFocus,
  label = 'One-time code',
  name,
  id,
  className,
  style,
}: OTPInputProps) {
  const clean = useCallback(
    (v: string) => {
      const s = v.replace(allowed[type], '');
      return (type === 'alphanumeric' ? s.toUpperCase() : s).slice(0, length);
    },
    [type, length],
  );
  const [inner, setInner] = useState(() => clean(defaultValue));
  const code = clean(value ?? inner);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const edges = useRef<{ l: Spring; r: Spring } | null>(null);
  const latest = useLatest({ onValueChange, onComplete });
  const auto = useId();

  const change = (raw: string) => {
    const next = clean(raw);
    if (next === code) return;
    if (value === undefined) setInner(next);
    latest.current.onValueChange?.(next);
    if (next.length === length && code.length < length) latest.current.onComplete?.(next);
  };

  const full = code.length >= length;
  const at = Math.min(code.length, length - 1);

  // Slide the caret: the leading edge is stiffer, so it stretches toward the next cell.
  useIsomorphicLayoutEffect(() => {
    const el = caret.current;
    const cell = root.current?.querySelector<HTMLElement>(`[data-cell="${at}"]`);
    if (!el || !cell) return;
    const left = cell.offsetLeft;
    const right = left + cell.offsetWidth;
    if (!edges.current) {
      const paint = () => {
        const e = edges.current!;
        el.style.transform = `translateX(${e.l.value}px)`;
        el.style.width = `${Math.max(e.r.value - e.l.value, 0)}px`;
      };
      edges.current = {
        l: new Spring({ from: left, onUpdate: paint }),
        r: new Spring({ from: right, onUpdate: paint }),
      };
      paint();
      return;
    }
    const e = edges.current;
    const forward = left > e.l.target;
    const fast = resolveSpring({ stiffness: 700, damping: 40 });
    const slow = resolveSpring({ stiffness: 260, damping: 20 });
    e.l.set(left, { config: forward ? slow : fast });
    e.r.set(right, { config: forward ? fast : slow });
  }, [at, length, groupSize]);

  useEffect(
    () => () => {
      edges.current?.l.stop();
      edges.current?.r.stop();
    },
    [],
  );

  // The caret always sits at the end — typing never lands in the middle.
  const toEnd = () => {
    const el = input.current;
    if (el) requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
  };

  const cells: ReactNode[] = [];
  for (let i = 0; i < length; i++) {
    if (groupSize && i > 0 && i % groupSize === 0)
      cells.push(<span key={`sep-${i}`} className="vz-otp-sep" />);
    const ch = code[i];
    cells.push(
      <span
        key={i}
        data-cell={i}
        data-filled={ch ? '' : undefined}
        data-current={focused && i === at && !full ? '' : undefined}
        className="vz-otp-cell"
        style={{ '--vz-i': i } as CSSProperties}
      >
        {/* keyed by the character so a replaced one drops in again */}
        {ch && (
          <span key={ch} className="vz-otp-char">
            {mask ? '•' : ch}
          </span>
        )}
      </span>,
    );
  }

  return (
    <div
      ref={root}
      className={cx('vz-otp', className)}
      style={style}
      data-focused={focused || undefined}
      data-complete={full || undefined}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <span ref={caret} className="vz-otp-caret" aria-hidden="true" />
      <div className="vz-otp-cells" aria-hidden="true">
        {cells}
      </div>
      <input
        ref={input}
        id={id ?? auto}
        className="vz-otp-input"
        data-vz-focus-ring="off"
        name={name}
        value={code}
        aria-label={label}
        aria-invalid={invalid || undefined}
        inputMode={type === 'numeric' ? 'numeric' : 'text'}
        pattern={type === 'numeric' ? '[0-9]*' : '[0-9A-Za-z]*'}
        autoComplete="one-time-code"
        autoCapitalize={type === 'alphanumeric' ? 'characters' : 'off'}
        spellCheck={false}
        maxLength={length}
        disabled={disabled}
        autoFocus={autoFocus}
        type={mask ? 'password' : 'text'}
        onChange={(e) => change(e.target.value)}
        onFocus={() => {
          setFocused(true);
          toEnd();
        }}
        onBlur={() => setFocused(false)}
        onPointerUp={toEnd}
        onSelect={(e) => {
          const el = e.currentTarget;
          if (el.selectionStart !== el.value.length) toEnd();
        }}
      />
    </div>
  );
}

// ——————————————————————————— File dropzone ———————————————————————————

export interface FileRejection {
  file: File;
  reason: 'type' | 'size' | 'count';
}

export interface FileDropzoneProps {
  /** Same syntax as `<input accept>`: "image/*,.pdf". */
  accept?: string;
  multiple?: boolean;
  /** Largest file in bytes. */
  maxSize?: number;
  /** Most files kept at once. */
  maxFiles?: number;
  /** Controlled list of files. */
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  /** Main line. Default "Drop files here or browse". */
  title?: ReactNode;
  /** Secondary line, e.g. "PNG or JPG, up to 5 MB". */
  hint?: ReactNode;
  icon?: ReactNode;
  /** List the chosen files under the zone. Default true. */
  showFiles?: boolean;
  disabled?: boolean;
  /** Submitted with forms (the input holds every chosen file). */
  name?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/** Whether a file matches an `accept` string (MIME types, `type/*` and extensions). */
export function acceptsFile(file: Pick<File, 'name' | 'type'>, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
      return mime === rule;
    });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`;
}

const UploadIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 15V4m0 0l-4 4m4-4l4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * A file drop target with a liquid surface: it swells when a file is dragged over, a pool of
 * light follows the file, and a drop sends a splash ring out from where it landed. It's a
 * real file input underneath — click, Enter or Space to browse.
 */
export function FileDropzone({
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  files: filesProp,
  onFilesChange,
  onReject,
  title = (
    <>
      Drop files here or <u>browse</u>
    </>
  ),
  hint,
  icon = <UploadIcon />,
  showFiles = true,
  disabled,
  name,
  id,
  className,
  style,
}: FileDropzoneProps) {
  const [inner, setInner] = useState<File[]>([]);
  const files = filesProp ?? inner;
  const [over, setOver] = useState(false);
  const [splash, setSplash] = useState<{ n: number; x: number; y: number } | null>(null);
  const [rejected, setRejected] = useState(false);
  const zone = useRef<HTMLLabelElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const latest = useLatest({ files, onFilesChange, onReject });

  const update = (next: File[]) => {
    if (filesProp === undefined) setInner(next);
    latest.current.onFilesChange?.(next);
  };

  const add = (list: FileList | File[] | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const rejections: FileRejection[] = [];
    const ok: File[] = [];
    for (const file of multiple ? incoming : incoming.slice(0, 1)) {
      if (!acceptsFile(file, accept)) rejections.push({ file, reason: 'type' });
      else if (maxSize !== undefined && file.size > maxSize)
        rejections.push({ file, reason: 'size' });
      else ok.push(file);
    }
    const prev = multiple ? latest.current.files : [];
    const same = (a: File, b: File) =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    let next = [...prev, ...ok.filter((f) => !prev.some((p) => same(p, f)))];
    if (maxFiles !== undefined && next.length > maxFiles) {
      for (const f of next.slice(maxFiles)) rejections.push({ file: f, reason: 'count' });
      next = next.slice(0, maxFiles);
    }
    if (ok.length) update(next);
    if (rejections.length) {
      latest.current.onReject?.(rejections);
      setRejected(true);
    }
  };

  // With a `name`, the input carries the whole list so a plain <form> submits it.
  useEffect(() => {
    const el = input.current;
    if (!name || !el || typeof DataTransfer === 'undefined') return;
    try {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      el.files = dt.files;
    } catch {
      // Older browsers can't assign FileLists; the change event still reports files.
    }
  }, [files, name]);

  useEffect(() => {
    if (!rejected) return;
    const t = setTimeout(() => setRejected(false), 600);
    return () => clearTimeout(t);
  }, [rejected]);

  const point = (e: React.DragEvent) => {
    const r = zone.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const { x, y } = point(e);
    zone.current?.style.setProperty('--vz-drop-x', `${x}px`);
    zone.current?.style.setProperty('--vz-drop-y', `${y}px`);
  };

  return (
    <div className={cx('vz-dropzone-wrap', className)} style={style}>
      <label
        ref={zone}
        htmlFor={inputId}
        className="vz-dropzone"
        data-over={over || undefined}
        data-rejected={rejected || undefined}
        data-disabled={disabled || undefined}
        onDragEnter={(e) => {
          if (disabled) return;
          e.preventDefault();
          depth.current++;
          setOver(true);
        }}
        onDragOver={onDragOver}
        onDragLeave={() => {
          depth.current = Math.max(depth.current - 1, 0);
          if (!depth.current) setOver(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          depth.current = 0;
          setOver(false);
          setSplash((s) => ({ n: (s?.n ?? 0) + 1, ...point(e) }));
          add(e.dataTransfer.files);
        }}
      >
        <span className="vz-dropzone-pool" aria-hidden="true" />
        {splash && (
          <span
            key={splash.n}
            className="vz-dropzone-splash"
            aria-hidden="true"
            style={{ left: splash.x, top: splash.y }}
          />
        )}
        <span className="vz-dropzone-icon">{icon}</span>
        <span className="vz-dropzone-title">{title}</span>
        {hint && (
          <span id={hintId} className="vz-dropzone-hint">
            {hint}
          </span>
        )}
        <input
          ref={input}
          id={inputId}
          type="file"
          className="vz-sr-only"
          data-vz-focus-ring="off"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => {
            add(e.target.files);
            // Choosing the same file again should still fire a change.
            if (!name) e.target.value = '';
          }}
        />
      </label>
      {showFiles && files.length > 0 && (
        <ul className="vz-dropzone-files" aria-label="Chosen files">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${f.lastModified}`}
              className="vz-dropzone-file"
              style={{ '--vz-i': i } as CSSProperties}
            >
              <span className="vz-dropzone-file-name">{f.name}</span>
              <span className="vz-dropzone-file-size">{formatBytes(f.size)}</span>
              <button
                type="button"
                className="vz-dropzone-remove"
                aria-label={`Remove ${f.name}`}
                disabled={disabled}
                onClick={() => {
                  update(files.filter((x) => x !== f));
                  input.current?.focus();
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
