import { Home, LogOut, Trophy } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

function AppShell({ tabs, activeTab, onGoHome, onTabChange, children }) {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    onGoHome();
  }

  function initials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 text-white shadow">
                <Trophy size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Visal Trivia</p>
                <h1 className="text-lg font-bold tracking-normal sm:text-2xl">General Knowledge Challenge</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow">{initials(user.name)}</div>
                  <div className="hidden flex-col text-right sm:flex">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-slate-500">Player</span>
                  </div>
                </div>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={onGoHome}
                  type="button"
                >
                  <Home size={16} aria-hidden="true" />
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <nav className="mt-4 grid gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                    isActive ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow" : "text-zinc-700 hover:bg-slate-100"
                  }`}
                  onClick={() => onTabChange(tab.id)}
                  type="button"
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}

export default AppShell;
