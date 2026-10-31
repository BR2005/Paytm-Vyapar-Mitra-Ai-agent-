import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("vyaparmitra_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (e) {
      // ignore
    }
    return "dark"; // Default to premium dark mode or system
  });

  const isDark = theme === "dark";
  const logoSrc = isDark ? "/vyaparmitra-logo-dark.png" : "/vyaparmitra-logo-light.png";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    // Dynamically update favicon based on theme
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = logoSrc;
    }

    // Dynamically update mobile browser address bar color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = isDark ? "#060a14" : "#ffffff";
    }

    try {
      localStorage.setItem("vyaparmitra_theme", theme);
    } catch (e) {
      // ignore
    }
  }, [theme, isDark, logoSrc]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme) => {
    if (newTheme === "light" || newTheme === "dark") {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, logoSrc }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
