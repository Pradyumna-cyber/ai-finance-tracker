interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/brand/aira-logo.png"
        alt="Aira"
        className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.2)]"
      />
      {!compact && (
        <div>
          <p className="text-base font-bold tracking-tight text-white">Aira</p>
          <p className="text-[10px] font-medium text-slate-500">AI-powered finance tracker</p>
        </div>
      )}
    </div>
  );
}
