export function NeedTag({
  children,
  variant = "need",
}: {
  children: React.ReactNode;
  variant?: "need" | "have";
}) {
  const styles =
    variant === "need"
      ? "border-[var(--color-critical)] text-[var(--color-critical)] bg-[color-mix(in_oklab,var(--color-critical)_6%,transparent)]"
      : "border-[var(--color-resolved)] text-[var(--color-resolved)] bg-[color-mix(in_oklab,var(--color-resolved)_6%,transparent)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border-hair px-2 py-0.5 text-[12px] font-normal ${styles}`}
    >
      {children}
    </span>
  );
}
