import { motion } from 'framer-motion';
import { ChevronRight, Download, LogOut, Shapes, User } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from 'react-router-dom';
import BudgetSettings from '@/components/dashboard/BudgetSettings';

export default function Settings() {
  const navigate = useNavigate();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { user } = useUserStore();

  const handleExportData = () => {
    const data = {
      user,
      expenses,
      categories,
      exportedAt: new Date().toISOString(),
    };

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`
    );
    element.setAttribute('download', `expense-backup-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure? This will delete all expenses and categories.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleResetOnboarding = () => {
    if (window.confirm('This will restart the onboarding process.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  interface SettingsItem {
    icon: any;
    label: string;
    description: string;
    action: () => void;
    danger?: boolean;
  }

  interface SettingsSection {
    title: string;
    items: SettingsItem[];
  }

  const settingsSections: SettingsSection[] = [
    {
      title: 'Data',
      items: [
        {
          icon: Download,
          label: 'Export Data',
          description: `${expenses.length} expenses backed up`,
          action: handleExportData,
        },
        {
          icon: LogOut,
          label: 'Clear All Data',
          description: 'Delete all expenses and categories',
          action: handleClearData,
          danger: true,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          icon: Shapes,
          label: 'Manage Categories',
          description: `${categories.length} categories`,
          action: () => navigate('/categories'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Reset Onboarding',
          description: 'Start fresh with profile setup',
          action: handleResetOnboarding,
          danger: true,
        },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="app-page"
    >
      <div className="page-shell max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow">Control center</p>
        <h1 className="page-title mt-1">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Manage salary, categories, data, and your Expense Copilot profile.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
        {/* User Profile Card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-2xl font-bold text-cyan-100">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{user.name}</h2>
                <p className="text-sm text-dark-400">{user.age} years old</p>
              </div>
            </div>
          </motion.div>
        )}

        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h2 className="text-xs font-semibold text-dark-400 uppercase mb-2 ml-1">
              {section.title}
            </h2>

            <div className="surface-card overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                    onClick={item.action}
                    className={`group flex w-full items-center justify-between border-b border-white/[0.06] p-4 text-left transition-all last:border-b-0 ${
                      item.danger
                        ? 'hover:bg-red-500/[0.07]'
                        : 'hover:bg-white/[0.035]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`p-2 rounded-lg ${
                          item.danger
                            ? 'bg-red-500/20'
                            : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
                        }`}
                      >
                        <Icon
                          size={20}
                          className={item.danger ? 'text-red-500' : 'text-accent-500'}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            item.danger ? 'text-red-500' : 'text-white'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-dark-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-700" />

                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="surface-card px-4 py-4 text-center"
        >
          <p className="text-xs text-dark-500 mb-2">AI Expense Copilot</p>
          <p className="text-lg font-bold text-white">v1.0.0</p>
          <p className="text-xs text-dark-500 mt-2">
            Modern expense tracking for smarter financial decisions
          </p>
        </motion.div>

        {/* AI Integration Section */}
        {/* <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="surface-card mt-6 border-violet-400/15 px-4 py-4"
        >
          <p className="text-xs font-semibold text-accent-400 uppercase mb-2">
            AI updates
          </p>
          <p className="text-sm font-semibold text-white mb-2">
            AI-Powered Insights
          </p>
          <ul className="space-y-1 text-xs text-dark-300">
            <li>✓ Budget predictions</li>
            <li>✓ Spending insights & anomaly detection</li>
            <li>✓ AI financial coach</li>
            <li className="text-slate-400">• Smart expense categorization (coming soon)</li>
            <li className="text-slate-400">• Voice-based expense entry (coming soon)</li>
          </ul>
        </motion.div> */}
        </div>
        <div>
          <div className="surface-card p-5">
            <div className="mb-4">
              <p className="eyebrow">Money setup</p>
              <h2 className="section-title mt-1">Budget & deductions</h2>
            </div>
            <BudgetSettings />
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
