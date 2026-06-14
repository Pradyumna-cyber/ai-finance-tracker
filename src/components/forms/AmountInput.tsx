import { useRef, useEffect } from 'react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AmountInput({ value, onChange }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[₹,\s]/g, '');
    // Allow only numbers and decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-blue-500/[0.08] to-cyan-500/[0.04] p-1">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-cyan-300">
        ₹
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="0"
        inputMode="decimal"
        className="w-full rounded-xl border border-transparent bg-[#07111f]/80 py-5 pl-11 pr-4 text-4xl font-bold tracking-tight text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/30"
      />
    </div>
  );
}
