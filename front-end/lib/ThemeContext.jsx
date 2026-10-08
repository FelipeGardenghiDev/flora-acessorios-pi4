import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'flora_tema';

function applyThemeClass(tema) {
  document.documentElement.classList.toggle('dark', tema === 'dark');
}

export const ThemeProvider = ({ children }) => {
  const [tema, setTemaState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light');

  useEffect(() => {
    applyThemeClass(tema);
  }, [tema]);

  const setTema = (novoTema) => {
    setTemaState(novoTema);
    localStorage.setItem(STORAGE_KEY, novoTema);
    applyThemeClass(novoTema);
  };

  return (
    <ThemeContext.Provider value={{ tema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
