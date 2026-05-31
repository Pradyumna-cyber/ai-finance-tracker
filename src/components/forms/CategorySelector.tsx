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
    <div className="grid grid-cols-4 gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          type="button"
          className={clsx(
            'flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-2',
            selectedId === category.id
              ? 'border-accent-500 bg-dark-800'
              : 'border-dark-700 bg-dark-800/50 hover:bg-dark-800'
          )}
        >
          <span className="text-2xl">{category.icon}</span>
          <span className="text-xs font-medium text-dark-300 text-center truncate">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
}
