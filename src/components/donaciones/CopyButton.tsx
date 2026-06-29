import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function CopyButton({ value, label, className, size = "sm" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copiado: ${label ?? value}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const sizeCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Copiar ${label ?? value}`}
      className={
        className ??
        "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
      }
    >
      {copied ? <Check className={sizeCls} /> : <Copy className={sizeCls} />}
    </button>
  );
}
