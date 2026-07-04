
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
// @ts-ignore: side-effect import for CSS
import './index.css';

import { useThemeStore } from '@/store/themeStore';

function Root() {
  const { darkMode } = useThemeStore();

  return (
    <div className={`h-full ${darkMode ? "dark" : ""}`}>
      <App />
    </div>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
