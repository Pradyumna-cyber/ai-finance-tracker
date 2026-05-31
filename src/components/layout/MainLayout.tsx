import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isAddPage = location.pathname === '/add';

  return (
    <div className="flex flex-col h-screen bg-dark-950">
      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${!isAddPage ? 'pb-nav' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
