import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, BarChart3, Settings, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home', id: 'home' },
    { path: '/add', icon: Plus, label: 'Add', id: 'add' },
    { path: '/ask-ai', icon: MessageSquare, label: 'Ask AI', id: 'ask' },
    { path: '/reports', icon: BarChart3, label: 'Reports', id: 'reports' },
    { path: '/settings', icon: Settings, label: 'Settings', id: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[calc(76px+env(safe-area-inset-bottom))] border-t border-white/[0.08] bg-[#07111f]/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex h-full max-w-lg items-center justify-around">
        {navItems.map(({ path, icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={clsx(
              'relative flex h-full w-full flex-col items-center justify-center gap-1.5 text-[10px] font-semibold transition-all duration-200',
              isActive(path)
                ? 'text-cyan-300'
                : 'text-slate-600 hover:text-slate-300',
              id === 'add' && '-translate-y-2'
            )}
            aria-label={label}
          >
            <span className={clsx(id === 'add' && 'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_8px_25px_rgba(14,165,233,0.35)]')}>
              <Icon size={id === 'add' ? 22 : 20} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
