import { Bot } from 'lucide-react';

interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-blue-600/25 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
        <Bot size={23} className="text-cyan-200" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07111f] bg-emerald-400" />
      </div>
      {!compact && (
        <div>
          <p className="text-base font-bold tracking-tight text-white">Expense Copilot</p>
          <p className="text-[10px] font-medium text-slate-500">AI-powered finance tracker</p>
        </div>
      )}
    </div>
  );
}
