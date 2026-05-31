interface Props {
  title: string;
  description?: string;
  type?: "success" | "warning" | "danger";
}

export default function InsightCard({
  title,
  description,
  type = "success",
}: Props) {
  const styles = {
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",

    warning:
      "border-orange-500/20 bg-orange-500/10 text-orange-300",

    danger:
      "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <div
      className={`
        rounded-2xl
        border
        p-4
        ${styles[type]}
      `}
    >
      <h3 className="text-sm font-semibold">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          {description}
        </p>
      )}
    </div>
  );
}