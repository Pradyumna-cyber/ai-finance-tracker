import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';
import { generateId } from '@/utils/formatters';

const ICON_OPTIONS = [
  '🍔', '🍕', '🍜', '🥗', '☕',
  '✈️', '🚗', '🚆', '🏨', '🗺️',
  '🏦', '💳', '💰', '📊', '📈',
  '🎬', '🎮', '🎸', '🎪', '🏋️',
  '👗', '👠', '💄', '👜', '⌚',
  '📱', '💻', '⌨️', '🖥️', '🎧',
];

const COLOR_OPTIONS = [
  'from-orange-500 to-red-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-purple-500',
  'from-yellow-500 to-orange-500',
  'from-red-500 to-pink-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '💰', color: 'from-purple-500 to-pink-500' });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    addCategory({
      id: generateId(),
      ...newCategory,
    });

    setNewCategory({ name: '', icon: '💰', color: 'from-purple-500 to-pink-500' });
    setIsAdding(false);
  };

  const handleUpdateCategory = (id: string) => {
    updateCategory(id, newCategory);
    setEditingId(null);
    setNewCategory({ name: '', icon: '💰', color: 'from-purple-500 to-pink-500' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-dark-950 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-dark-900 to-transparent px-4 pt-6 pb-4 border-b border-dark-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <Plus size={24} className="text-accent-500" />
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2 px-4 py-4">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between group hover:border-dark-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`text-3xl`}>{cat.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{cat.name}</p>
                <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${cat.color} mt-1`} />
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
        >
          <motion.div
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            className="w-full bg-dark-900 rounded-t-3xl p-4 space-y-4"
          >
            <div>
              <p className="text-dark-400 text-xs font-medium mb-2">Category Name</p>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder="Enter category name"
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-accent-500"
              />
            </div>

            <div>
              <p className="text-dark-400 text-xs font-medium mb-2">Icon</p>
              <div className="grid grid-cols-10 gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() =>
                      setNewCategory({ ...newCategory, icon })
                    }
                    className={`text-2xl p-2 rounded ${
                      newCategory.icon === icon
                        ? 'bg-accent-500'
                        : 'bg-dark-800 hover:bg-dark-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-dark-400 text-xs font-medium mb-2">Color</p>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      setNewCategory({ ...newCategory, color })
                    }
                    className={`h-10 rounded-lg bg-gradient-to-r ${color} border-2 ${
                      newCategory.color === color
                        ? 'border-white'
                        : 'border-transparent'
                    }`}
                  />
                ))}
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
                className="flex-1 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
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
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:bg-dark-700 transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Category
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
