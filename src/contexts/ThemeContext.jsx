import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export function ThemeProvider({ children }) {
  // Check local storage or system preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('arkon_theme');
    if (saved) return saved;
    return 'light';
  });

  useEffect(() => {
    // Update document data-theme attribute for CSS variables
    document.documentElement.setAttribute('data-theme', theme);
    // Also toggle tailwind 'dark' class just in case
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('arkon_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
