import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Field({
  label,
  error,
  children,
  required,
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
        {required && <span className="text-[var(--color-critical)] ml-0.5">*</span>}
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

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[90px] ${props.className ?? ""}`} />;
}
