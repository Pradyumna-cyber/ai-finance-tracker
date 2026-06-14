import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Shapes } from 'lucide-react';
import { useCategoryStore, CATEGORY_ICONS } from '@/store/categoryStore';
import clsx from 'clsx';
import { useExpenseStore } from '@/store/expenseStore';
import { formatCurrency, generateId } from '@/utils/formatters';
import { getUniqueCategoryColor, suggestCategoryIcon } from '@/utils/categoryPresentation';

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { getTotalByCategory } = useExpenseStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: '' });
  const suggestedIcon = suggestCategoryIcon(newCategory.name);
  const suggestedColor = getUniqueCategoryColor(newCategory.name, categories, editingId || undefined);
  const previewIcon = newCategory.icon || suggestedIcon;

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    addCategory({
      id: generateId(),
      ...newCategory,
      icon: suggestedIcon,
      color: suggestedColor,
    });

    setNewCategory({ name: '', icon: '💰', color: 'from-purple-500 to-pink-500' });
    setIsAdding(false);
  };

  const handleUpdateCategory = (id: string) => {
    updateCategory(id, { name: newCategory.name });
    setEditingId(null);
    setNewCategory({ name: '', icon: '💰', color: 'from-purple-500 to-pink-500' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="app-page"
    >
      <div className="page-shell max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Organize spending</p>
          <h1 className="page-title mt-1">Categories</h1>
          <p className="mt-2 text-sm text-slate-500">{categories.length} categories ready for smarter reports.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="primary-button"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add category</span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="surface-card surface-card-hover group flex items-center justify-between p-4"
          >
              <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center text-xl">{cat.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{cat.name}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{formatCurrency(getTotalByCategory(cat.id))} spent</p>
                <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${cat.color} mt-1`} />
              </div>
            </div>

            <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                onClick={() => {
                  setEditingId(cat.id);
                  setNewCategory({
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                  });
                }}
                className="p-2 hover:bg-blue-500/20 rounded"
              >
                <Edit2 size={16} className="text-blue-500" />
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="p-2 hover:bg-red-500/20 rounded"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end bg-[#020617]/80 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
        >
          <motion.div
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            className="surface-card w-full space-y-4 rounded-t-xl p-5 sm:max-w-xl sm:rounded-xl"
          >
            <div>
              <p className="text-dark-400 text-xs font-medium mb-2">Category Name</p>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
                className="field-control"
                autoFocus
              />
            </div>

            <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-4">
              <p className="eyebrow">Smart preview</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center text-2xl">
                  {newCategory.name.trim() ? previewIcon : '+'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {newCategory.name.trim() || 'Start typing a category'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Expense Copilot chooses a relevant icon and an unused color automatically.
                  </p>
                </div>
              </div>
              {/* Icon picker */}
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">Pick an icon (or use suggestion)</p>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon: ic })}
                      className={clsx(
                        'h-8 w-8 flex items-center justify-center rounded-md text-lg transition',
                        newCategory.icon === ic
                          ? 'ring-2 ring-cyan-400'
                          : 'hover:bg-white/5'
                      )}
                    >
                      {ic}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon: '' })}
                    className="h-8 w-8 flex items-center justify-center rounded-md border border-white/10 text-sm text-slate-400 hover:bg-white/5"
                  >
                    Use suggestion
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setNewCategory({
                    name: '',
                    icon: '💰',
                    color: 'from-purple-500 to-pink-500',
                  });
                }}
                className="secondary-button flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  editingId
                    ? handleUpdateCategory(editingId)
                    : handleAddCategory()
                }
                disabled={!newCategory.name.trim()}
                className="primary-button flex-1"
              >
                {editingId ? 'Update' : 'Add'} Category
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </motion.div>
  );
}
