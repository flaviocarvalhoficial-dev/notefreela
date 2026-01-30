import * as React from "react";
import { ThemeProvider as InternalThemeProvider } from "@/hooks/use-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <InternalThemeProvider defaultTheme="dark">{children}</InternalThemeProvider>;
}
