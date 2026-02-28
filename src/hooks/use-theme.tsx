import * as React from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyThemeToDom(theme: Theme) {
  const root = document.documentElement;

  // Create a transition-stopper style tag
  const disableTransitions = document.createElement("style");
  disableTransitions.innerHTML = `
    * {
      -webkit-transition: none !important;
      -moz-transition: none !important;
      -ms-transition: none !important;
      -o-transition: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(disableTransitions);

  // Perform the theme swap
  root.classList.remove("dark", "light");
  root.classList.add(theme);

  // Force a reflow to ensure the theme change is applied before re-enabling transitions
  // This is a common trick to make the browser calculate the new styles immediately
  window.getComputedStyle(root).opacity;

  // Remove the transition-stopper
  document.head.removeChild(disableTransitions);
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
        applyThemeToDom(stored);
        return;
      }
    } catch {
      // ignore
    }

    applyThemeToDom(defaultTheme);
  }, [defaultTheme, storageKey]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyThemeToDom(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
