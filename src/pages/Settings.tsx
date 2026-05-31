import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, LogOut, Zap, Settings as SettingsIcon, User } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from 'react-router-dom';
import BudgetSettings from '@/components/dashboard/BudgetSettings';

export default function Settings() {
  const navigate = useNavigate();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { user, completeOnboarding } = useUserStore();
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    toggle?: boolean;
    danger?: boolean;
  }

  interface SettingsSection {
    title: string;
    items: SettingsItem[];
  }

  const settingsSections: SettingsSection[] = [
    {
      title: 'Appearance',
      items: [
        {
          icon: SettingsIcon,
          label: 'Dark Mode',
          description: 'Always on for premium feel',
          action: () => setIsDarkMode(!isDarkMode),
          toggle: isDarkMode,
        },
      ],
    },
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
          icon: Zap,
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
      className="min-h-screen bg-dark-950 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-dark-900 to-transparent px-4 pt-6 pb-4 border-b border-dark-800">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Content */}
      <div className="space-y-4 px-4 py-4">
        {/* User Profile Card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{user.name}</h2>
                <p className="text-sm text-dark-400">{user.age} years old</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-dark-800 rounded-2xl border border-dark-700 p-4"
        >
          <h2 className="text-lg font-bold text-white mb-3">Budget & Deductions</h2>
          <BudgetSettings />
        </motion.div>

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

            <div className="space-y-2">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                      item.danger
                        ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20'
                        : 'bg-dark-800 border-dark-700 hover:border-dark-600 hover:bg-dark-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`p-2 rounded-lg ${
                          item.danger
                            ? 'bg-red-500/20'
                            : 'bg-dark-700 group-hover:bg-dark-600'
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

                    {item.toggle !== undefined && (
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          item.toggle ? 'bg-accent-500' : 'bg-dark-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                            item.toggle ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    )}
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
          className="mt-8 px-4 py-4 bg-dark-800/50 rounded-xl border border-dark-700 text-center"
        >
          <p className="text-xs text-dark-500 mb-2">AI Expense Copilot</p>
          <p className="text-lg font-bold text-white">v1.0.0</p>
          <p className="text-xs text-dark-500 mt-2">
            Modern expense tracking for smarter financial decisions
          </p>
        </motion.div>

        {/* Future AI Integration Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 px-4 py-4 bg-gradient-to-br from-accent-500/10 to-accent-600/5 rounded-xl border border-accent-500/30"
        >
          <p className="text-xs font-semibold text-accent-400 uppercase mb-2">
            Coming Soon
          </p>
          <p className="text-sm font-semibold text-white mb-2">
            AI-Powered Insights
          </p>
          <ul className="space-y-1 text-xs text-dark-300">
            <li>✓ Smart expense categorization</li>
            <li>✓ Budget predictions</li>
            <li>✓ Spending insights & anomaly detection</li>
            <li>✓ AI financial coach</li>
            <li>✓ Voice-based expense entry</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
