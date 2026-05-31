import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, BarChart3, Settings } from 'lucide-react';
import clsx from 'clsx';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home', id: 'home' },
    { path: '/add', icon: Plus, label: 'Add', id: 'add' },
    { path: '/reports', icon: BarChart3, label: 'Reports', id: 'reports' },
    { path: '/settings', icon: Settings, label: 'Settings', id: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-nav bg-dark-900 border-t border-dark-800 z-40">
      <div className="flex items-center justify-around h-full max-w-full">
        {navItems.map(({ path, icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={clsx(
              'flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200',
              isActive(path)
                ? 'text-accent-500'
                : 'text-dark-500 hover:text-dark-300'
            )}
            aria-label={label}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
