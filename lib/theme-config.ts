// lib/theme-config.ts
export const themeConfig = {
  // Brand Colors
  brand: {
    primary: "#6366f1",
    primaryHover: "#5254cc",
    primaryLight: "#a5b4fc",
    primaryDark: "#4f46e5",
  },
  
  // Background Colors
  background: {
    light: "#ffffff",
    dark: "#0a0a0f",
    cardLight: "#f8f9fa",
    cardDark: "#0e0e18",
    codeLight: "#f3f4f6",
    codeDark: "#111118",
  },
  
  // Text Colors
  text: {
    light: {
      primary: "#111111",
      secondary: "#6b7280",
      muted: "#9ca3af",
    },
    dark: {
      primary: "#f0f0f5",
      secondary: "#6b6b85",
      muted: "#3a3a55",
    }
  },
  
  // Border Colors
  border: {
    light: "#e5e7eb",
    dark: "#1e1e2e",
  },
  
  // Status Colors
  status: {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  },
  
  // Typography
  fonts: {
    mono: "'DM Mono', 'Fira Code', monospace",
    display: "'Syne', sans-serif",
  },
  
  // Shadows
  shadow: {
    light: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
    dark: "0 1px 3px 0 rgb(0 0 0 / 0.3)",
  },
  
  // Animation
  animation: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
  }
};

// Helper to get theme variables
export const getThemeStyles = (isDark: boolean) => ({
  bgColor: isDark ? themeConfig.background.dark : themeConfig.background.light,
  textPrimary: isDark ? themeConfig.text.dark.primary : themeConfig.text.light.primary,
  textSecondary: isDark ? themeConfig.text.dark.secondary : themeConfig.text.light.secondary,
  textMuted: isDark ? themeConfig.text.dark.muted : themeConfig.text.light.muted,
  cardBg: isDark ? themeConfig.background.cardDark : themeConfig.background.cardLight,
  borderColor: isDark ? themeConfig.border.dark : themeConfig.border.light,
  codeBg: isDark ? themeConfig.background.codeDark : themeConfig.background.codeLight,
  codeText: isDark ? "#a0a0b8" : "#374151",
  badgeText: isDark ? "#a5b4fc" : "#6366f1",
});