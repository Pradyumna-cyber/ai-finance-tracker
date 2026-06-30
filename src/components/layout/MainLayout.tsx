import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Home, Plus, Settings, Shapes, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import BottomNavigation from './BottomNavigation';
import BrandMark from './BrandMark';
import ReminderToast from '@/components/ReminderToast';
import AiraAssistant from '@/components/voice/AiraAssistant';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAddPage = location.pathname === '/add';
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/add', icon: Plus, label: 'Add Expense' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/categories', icon: Shapes, label: 'Categories' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <aside className="hidden w-[84px] shrink-0 flex-col border-r border-[#223149] bg-[#081321]/95 px-2 py-4 backdrop-blur-2xl lg:flex">
        <div className="flex justify-center"><BrandMark compact /></div>
        <nav className="mt-7 space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={clsx(
                'flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[9px] font-medium transition',
                location.pathname === path
                  ? 'bg-gradient-to-r from-blue-600/25 to-cyan-500/10 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
              )}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => navigate('/ask-ai')}
          className="mt-auto flex w-full items-center justify-center gap-3 rounded-lg border border-violet-400/15 bg-violet-500/[0.06] p-2 text-center hover:scale-[1.01]"
        >
          <Sparkles size={17} className="text-violet-300" />
          <p className="mt-1 text-[9px] font-semibold text-slate-400">Ask AI</p>
        </button>
      </aside>

      <main className={`min-w-0 flex-1 overflow-y-auto ${!isAddPage ? 'pb-nav lg:pb-0' : ''}`}>
        <ReminderToast />
        {children}
      </main>

      <AiraAssistant />
      <BottomNavigation />
    </div>
  );
}
