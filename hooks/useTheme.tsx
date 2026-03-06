import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { THEMES, type ThemeMode, type ThemeColors } from '../lib/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: THEMES.dark,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    // In production, persist to AsyncStorage:
    // AsyncStorage.setItem('theme_mode', m);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, colors: THEMES[mode], setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
