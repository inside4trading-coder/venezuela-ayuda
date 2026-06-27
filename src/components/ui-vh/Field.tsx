import {
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

// Política: ningún campo es obligatorio. La prop `required` se acepta
// por compatibilidad con código existente pero se ignora en runtime.

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] text-[var(--color-text-main)]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[12px] text-[var(--color-critical)]">{error}</span>
      )}
    </label>
  );
}

const inputBase =
  "w-full border-hair border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] rounded-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]";

function stripRequired<T extends { required?: boolean }>(props: T): T {
  if (!("required" in props)) return props;
  const { required: _ignored, ...rest } = props;
  return rest as T;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const safe = stripRequired(props);
  return <input {...safe} className={`${inputBase} ${safe.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const safe = stripRequired(props);
  return <select {...safe} className={`${inputBase} ${safe.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const safe = stripRequired(props);
  return <textarea {...safe} className={`${inputBase} min-h-[90px] ${safe.className ?? ""}`} />;
}
