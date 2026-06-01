import { Link } from 'react-router-dom';
import { Layers, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ subtext = "WORKSPACE", hideDarkMode = false, hideAuth = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav className="w-full bg-white dark:bg-[#080C1A] border-b border-border dark:border-border fixed top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
            <Layers className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-foreground dark:text-foreground">ARKON</h1>
            <p className="text-[10px] text-secondary dark:text-secondary font-medium tracking-wide uppercase">{subtext}</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {!hideDarkMode && (
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-muted dark:bg-white shadow-sm border border-border text-secondary dark:text-secondary hover:text-primary transition-all border border-transparent dark:border-border"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          
          {!hideAuth && (
            <>
              <div className="h-6 w-px bg-border dark:bg-white shadow-sm border border-border mx-1"></div>
              <Link to="/login" className="text-sm font-semibold text-secondary dark:text-secondary hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="text-sm font-bold bg-primary text-foreground px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-md shadow-primary/20">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}