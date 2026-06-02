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
    <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          type="button"
          className={clsx(
            'min-w-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-2',
            selectedId === category.id
              ? 'border-accent-500 bg-dark-800'
              : 'border-dark-700 bg-dark-800/50 hover:bg-dark-800'
          )}
        >
          <span className="text-2xl">{category.icon}</span>
          <span className="w-full min-w-0 truncate text-center text-xs font-medium text-dark-300">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
}
