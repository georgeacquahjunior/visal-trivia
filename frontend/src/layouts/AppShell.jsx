import { Home, LogOut, Trophy } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

function AppShell({ tabs, activeTab, onGoHome, onTabChange, children }) {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    onGoHome();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded bg-emerald-600 text-white">
              <Trophy size={24} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Visal Trivia</p>
              <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">General Knowledge Challenge</h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center justify-between gap-2 text-sm text-zinc-600 sm:justify-end">
              <span className="truncate">Hi, {user.name}</span>
              <button
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={onGoHome}
                type="button"
              >
                <Home size={16} aria-hidden="true" />
                Home
              </button>
              <button
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                onClick={handleLogout}
                type="button"
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>

            <nav
              className="grid gap-2 rounded bg-white p-1 shadow-sm ring-1 ring-zinc-200"
              style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
                      isActive ? "bg-emerald-600 text-white" : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                    onClick={() => onTabChange(tab.id)}
                    type="button"
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}

export default AppShell;
