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
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-dark-400">
        ₹
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="0"
        inputMode="decimal"
        className="w-full pl-10 pr-4 py-4 text-4xl font-bold text-white bg-dark-800 border-2 border-dark-700 rounded-xl focus:outline-none focus:border-accent-500 transition-colors placeholder-dark-600"
      />
    </div>
  );
}
