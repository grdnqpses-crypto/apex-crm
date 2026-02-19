import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Building2, Users, Kanban, X, Command } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const { data: results, isLoading } = trpc.dashboard.globalSearch.useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: debouncedQuery.length >= 1 }
  );

  const navigate = useCallback((path: string) => {
    setOpen(false);
    setQuery("");
    setLocation(path);
  }, [setLocation]);

  const totalResults = (results?.companies?.length ?? 0) + (results?.contacts?.length ?? 0) + (results?.deals?.length ?? 0);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/60 hover:bg-white/90 border border-stone-200/60 text-stone-400 text-sm transition-all group"
      >
        <Search className="h-4 w-4 text-stone-400 group-hover:text-amber-500 transition-colors" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] text-stone-500 font-mono">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Search Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => { setOpen(false); setQuery(""); }}
          />

          {/* Search Panel */}
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-stone-200/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
              <Search className="h-5 w-5 text-amber-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies, contacts, deals..."
                className="flex-1 bg-transparent outline-none text-sm text-stone-800 placeholder:text-stone-400"
                autoComplete="off"
              />
              {query && (
                <button onClick={() => setQuery("")} className="p-1 rounded-md hover:bg-stone-100">
                  <X className="h-4 w-4 text-stone-400" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] text-stone-500 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {!query && (
                <div className="px-4 py-8 text-center">
                  <Search className="h-8 w-8 text-stone-200 mx-auto mb-2" />
                  <p className="text-sm text-stone-400">Start typing to search across your CRM</p>
                  <p className="text-xs text-stone-300 mt-1">Companies, contacts, and deals</p>
                </div>
              )}

              {query && isLoading && (
                <div className="px-4 py-6 text-center">
                  <div className="h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-stone-400">Searching...</p>
                </div>
              )}

              {query && !isLoading && totalResults === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-stone-400">No results for "{query}"</p>
                  <p className="text-xs text-stone-300 mt-1">Try a different search term</p>
                </div>
              )}

              {results && totalResults > 0 && (
                <div className="py-2">
                  {/* Companies */}
                  {results.companies.length > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Companies</p>
                      {results.companies.map((c) => (
                        <button
                          key={`company-${c.id}`}
                          onClick={() => navigate(`/companies/${c.id}`)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-amber-50/60 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">{c.name}</p>
                            <p className="text-xs text-stone-400 truncate">{c.industry || "Company"} · {c.leadStatus || "New"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Contacts */}
                  {results.contacts.length > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Contacts</p>
                      {results.contacts.map((c) => (
                        <button
                          key={`contact-${c.id}`}
                          onClick={() => navigate(`/contacts/${c.id}`)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-blue-50/60 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-stone-400 truncate">{c.email || "Contact"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Deals */}
                  {results.deals.length > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Deals</p>
                      {results.deals.map((d) => (
                        <button
                          key={`deal-${d.id}`}
                          onClick={() => navigate(`/deals`)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-emerald-50/60 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shrink-0">
                            <Kanban className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">{d.name}</p>
                            <p className="text-xs text-stone-400 truncate">
                              {d.value ? `$${Number(d.value).toLocaleString()}` : "No value"} · {d.status || "Open"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <p className="text-[10px] text-stone-400">
                {totalResults > 0 ? `${totalResults} result${totalResults !== 1 ? "s" : ""}` : "Type to search"}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
