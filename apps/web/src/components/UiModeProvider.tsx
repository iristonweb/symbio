"use client";

import * as React from "react";

export type UiMode = "discover" | "expert";

const UiModeContext = React.createContext<{
  mode: UiMode;
  setMode: (m: UiMode) => void;
}>({
  mode: "discover",
  setMode: () => {},
});

export function UiModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<UiMode>("discover");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("symbio.uiMode") as UiMode | null;
      if (stored === "discover" || stored === "expert") setMode(stored);
    } catch {}
  }, []);

  const update = React.useCallback((m: UiMode) => {
    setMode(m);
    try {
      window.localStorage.setItem("symbio.uiMode", m);
    } catch {}
  }, []);

  return (
    <UiModeContext.Provider value={{ mode, setMode: update }}>
      {children}
    </UiModeContext.Provider>
  );
}

export function useUiMode() {
  return React.useContext(UiModeContext);
}
