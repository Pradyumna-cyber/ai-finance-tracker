import { useCategoryStore } from '@/store/categoryStore';
import clsx from 'clsx';

interface CategorySelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CategorySelector({
  selectedId,
  onSelect,
}: CategorySelectorProps) {
  const { categories } = useCategoryStore();

  return (
    <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:grid-cols-5">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          type="button"
          className={clsx(
            'min-w-0 flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
            selectedId === category.id
              ? 'border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_22px_rgba(34,211,238,0.08)]'
              : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.05]'
          )}
        >
          <span className="text-xl">{category.icon}</span>
          <span className="w-full min-w-0 truncate text-center text-[11px] font-semibold text-slate-300">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
}
