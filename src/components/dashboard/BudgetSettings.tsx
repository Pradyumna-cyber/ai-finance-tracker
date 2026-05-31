import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import { useBudgetStore, BudgetDeduction } from '@/store/budgetStore';
import { useExpenseStore } from '@/store/expenseStore';
import { formatCurrency, generateId } from '@/utils/formatters';

const CATEGORY_LABELS: Record<BudgetDeduction['category'], string> = {
  rent: 'Rent',
  bills: 'Bills',
  emi: 'EMI',
  sip: 'SIP',
  savings: 'Savings',
  investment: 'Investment',
  other: 'Other',
};

export default function BudgetSettings() {
  const {
    monthlySalary,
    deductions,
    salaryCreditType,
    fixedCreditDate,
    setMonthlySalary,
    addDeduction,
    updateDeduction,
    deleteDeduction,
    toggleDeduction,
    setSalaryCreditType,
    setFixedCreditDate,
  } = useBudgetStore();
  const { recalculateSalaryCycleIds } = useExpenseStore();

  const [isEditing, setIsEditing] = useState(false);
  const [currentDeduction, setCurrentDeduction] = useState<BudgetDeduction | null>(null);
  const [salaryInput, setSalaryInput] = useState(monthlySalary.toString());
  const [fixedDateInput, setFixedDateInput] = useState(fixedCreditDate.toString());

  useEffect(() => {
    setSalaryInput(monthlySalary.toString());
  }, [monthlySalary]);

  useEffect(() => {
    setFixedDateInput(fixedCreditDate.toString());
  }, [fixedCreditDate]);

  const resetForm = () => {
    setCurrentDeduction(null);
    setIsEditing(false);
  };

  const handleSaveDeduction = () => {
    if (!currentDeduction) return;
    if (currentDeduction.amount <= 0 || !currentDeduction.name.trim()) return;

    if (isEditing) {
      updateDeduction(currentDeduction.id, currentDeduction);
    } else {
      addDeduction({ ...currentDeduction, id: generateId() });
    }
    resetForm();
  };

  const handleSalaryCreditTypeChange = (type: 'fixed' | 'last_working_day') => {
    setSalaryCreditType(type);
    queueMicrotask(() => recalculateSalaryCycleIds());
  };

  const handleFixedCreditDateSave = () => {
    setFixedCreditDate(Number(fixedDateInput) || 1);
    queueMicrotask(() => recalculateSalaryCycleIds());
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-dark-400">Salary Per Cycle</p>
            <input
              type="number"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              onBlur={() => setMonthlySalary(Number(salaryInput) || 0)}
              min="0"
              className="mt-2 w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-accent-500 focus:outline-none text-base"
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setIsEditing(true);
                setCurrentDeduction({
                  id: generateId(),
                  name: '',
                  amount: 0,
                  category: 'other',
                  isActive: true,
                });
              }}
              className="w-full rounded-xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Deduction
            </button>
          </div>
        </div>

        {/* Salary Credit Cycle Config */}
        <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
          <div>
            <p className="text-sm text-dark-400 mb-2">How is your salary usually credited?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSalaryCreditTypeChange('last_working_day')}
                className={`py-2.5 px-3 rounded-xl border text-xs text-center transition-all ${
                  salaryCreditType === 'last_working_day'
                    ? 'bg-accent-500/20 border-accent-500 text-white font-semibold'
                    : 'bg-dark-900 border-dark-700 text-dark-400 hover:border-dark-600'
                }`}
              >
                Last Working Day
              </button>
              <button
                type="button"
                onClick={() => handleSalaryCreditTypeChange('fixed')}
                className={`py-2.5 px-3 rounded-xl border text-xs text-center transition-all ${
                  salaryCreditType === 'fixed'
                    ? 'bg-accent-500/20 border-accent-500 text-white font-semibold'
                    : 'bg-dark-900 border-dark-700 text-dark-400 hover:border-dark-600'
                }`}
              >
                Fixed Monthly Date
              </button>
            </div>
          </div>

          {salaryCreditType === 'fixed' && (
            <div>
              <p className="text-sm text-dark-400">Fixed Credit Date (1-31)</p>
              <input
                type="number"
                value={fixedDateInput}
                onChange={(e) => setFixedDateInput(e.target.value)}
                onBlur={handleFixedCreditDateSave}
                min="1"
                max="31"
                className="mt-2 w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-2.5 text-white focus:border-accent-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-4 space-y-4">
        {deductions.length === 0 ? (
          <p className="text-dark-400 text-sm">No deductions added yet. Add rent, bills, SIP, EMI, or savings.</p>
        ) : (
          <div className="space-y-3">
            {deductions.map((deduction) => (
              <div key={deduction.id} className="flex items-center justify-between gap-3 rounded-2xl bg-dark-900 p-3 border border-dark-700">
                <div>
                  <p className="text-sm font-semibold text-white">{deduction.name}</p>
                  <p className="text-xs text-dark-400">{CATEGORY_LABELS[deduction.category]}</p>
                  <p className="text-xs text-dark-500">{deduction.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatCurrency(deduction.amount)}</p>
                  <div className="flex items-center gap-2 justify-end mt-2">
                    <button
                      onClick={() => toggleDeduction(deduction.id)}
                      className="rounded-full border border-dark-700 px-2 py-1 text-xs text-white hover:bg-dark-700 transition"
                    >
                      {deduction.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCurrentDeduction(deduction);
                      }}
                      className="rounded-full border border-dark-700 px-2 py-1 text-xs text-white hover:bg-dark-700 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteDeduction(deduction.id)}
                      className="rounded-full border border-red-500 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentDeduction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 rounded-2xl border border-dark-700 p-4"
        >
          <div className="grid gap-4">
            <div>
              <label className="text-sm text-dark-400">Name</label>
              <input
                type="text"
                value={currentDeduction.name}
                onChange={(e) => setCurrentDeduction({ ...currentDeduction, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-accent-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-dark-400">Amount</label>
              <input
                type="number"
                value={currentDeduction.amount}
                onChange={(e) => setCurrentDeduction({ ...currentDeduction, amount: Number(e.target.value) })}
                className="mt-2 w-full rounded-2xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-accent-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-dark-400">Category</label>
              <select
                value={currentDeduction.category}
                onChange={(e) => setCurrentDeduction({ ...currentDeduction, category: e.target.value as BudgetDeduction['category'] })}
                className="mt-2 w-full rounded-2xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-accent-500 focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDeduction}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition"
              >
                <Save size={16} /> Save Deduction
              </button>
              <button
                onClick={resetForm}
                className="flex-1 rounded-2xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-white hover:bg-dark-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
