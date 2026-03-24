import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface KeyboardShortcutsContextValue {
  compactMode: boolean;
  toggleCompactMode: () => void;
  showShortcutsHelp: boolean;
  setShowShortcutsHelp: (v: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue>({
  compactMode: false,
  toggleCompactMode: () => {},
  showShortcutsHelp: false,
  setShowShortcutsHelp: () => {},
});

export function useKeyboardShortcuts() {
  return useContext(KeyboardShortcutsContext);
}

const SHORTCUTS: { key: string; mod?: "ctrl" | "shift"; description: string; path?: string }[] = [
  { key: "g", mod: "shift", description: "Go to Dashboard", path: "/dashboard" },
  { key: "c", mod: "shift", description: "Go to Contacts", path: "/contacts" },
  { key: "d", mod: "shift", description: "Go to Deals", path: "/deals" },
  { key: "t", mod: "shift", description: "Go to Tasks", path: "/tasks" },
  { key: "m", mod: "shift", description: "Go to SMS Inbox", path: "/sms" },
  { key: "p", mod: "shift", description: "Go to Pipeline", path: "/deals" },
  { key: "k", mod: "shift", description: "Toggle Compact Mode" },
  { key: "?", description: "Show Keyboard Shortcuts" },
  { key: "Escape", description: "Close dialogs / go back" },
];

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    try { return localStorage.getItem("axiom-compact-mode") === "true"; } catch { return false; }
  });
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [, navigate] = useLocation();

  const toggleCompactMode = useCallback(() => {
    setCompactMode(prev => {
      const next = !prev;
      try { localStorage.setItem("axiom-compact-mode", String(next)); } catch {}
      toast.success(next ? "Compact mode enabled" : "Compact mode disabled");
      return next;
    });
  }, []);

  useEffect(() => {
    // Apply compact mode class to root
    if (compactMode) {
      document.documentElement.classList.add("compact");
    } else {
      document.documentElement.classList.remove("compact");
    }
  }, [compactMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const key = e.key;
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;

      // ? → show shortcuts help
      if (key === "?" && !ctrl) {
        setShowShortcutsHelp(prev => !prev);
        return;
      }

      // Shift+K → toggle compact mode
      if (key === "K" && shift && !ctrl) {
        e.preventDefault();
        toggleCompactMode();
        return;
      }

      // Shift+G → Dashboard
      if (key === "G" && shift && !ctrl) { e.preventDefault(); navigate("/dashboard"); return; }
      // Shift+C → Contacts
      if (key === "C" && shift && !ctrl) { e.preventDefault(); navigate("/contacts"); return; }
      // Shift+D → Deals
      if (key === "D" && shift && !ctrl) { e.preventDefault(); navigate("/deals"); return; }
      // Shift+T → Tasks
      if (key === "T" && shift && !ctrl) { e.preventDefault(); navigate("/tasks"); return; }
      // Shift+M → SMS
      if (key === "M" && shift && !ctrl) { e.preventDefault(); navigate("/sms"); return; }
      // Shift+P → Pipeline (deals)
      if (key === "P" && shift && !ctrl) { e.preventDefault(); navigate("/deals"); return; }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, toggleCompactMode]);

  return (
    <KeyboardShortcutsContext.Provider value={{ compactMode, toggleCompactMode, showShortcutsHelp, setShowShortcutsHelp }}>
      {children}
      {showShortcutsHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcutsHelp(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Keyboard Shortcuts</h2>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowShortcutsHelp(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.mod === "shift" && (
                      <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded">Shift</kbd>
                    )}
                    {s.mod === "ctrl" && (
                      <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded">Ctrl</kbd>
                    )}
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded">{s.key}</kbd>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">Press <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded">?</kbd> to toggle this panel</p>
          </div>
        </div>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}
