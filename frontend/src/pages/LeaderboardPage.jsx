import { Medal, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { getLeaderboard } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { formatTime } from "../utils/format.js";

function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayedCount, setDisplayedCount] = useState(10);

  async function loadLeaderboard() {
    setIsLoading(true);
    setError("");
    try {
      setEntries(await getLeaderboard(100));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  if (isLoading) {
    return <LoadingState label="Loading leaderboard" />;
  }
  return (
    <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600/80">Top players</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Leaderboard</h2>
          <p className="mt-1 text-sm text-slate-500">Real-time high scores from players worldwide</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button
            onClick={loadLeaderboard}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 active:scale-95 sm:w-auto"
            type="button"
          >
            <RefreshCw size={16} strokeWidth={1.5} className="transition-transform group-active:rotate-180" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</p>}

      {entries.length === 0 ? (
        <EmptyState title="No scores yet" message="Play the first quiz to start the leaderboard." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {entries.slice(0, 3).map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center shadow-sm ${
                  idx === 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">#{idx + 1}</span>
                  <Medal className={idx === 0 ? "text-yellow-500" : "text-slate-400"} size={18} strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="text-lg font-bold text-slate-900">{entry.player_name}</div>
                <div className="text-blue-600 font-extrabold text-2xl">{entry.score}<span className="text-slate-400 text-sm">/{entry.total_questions}</span></div>
                <div className="mt-2 text-xs text-slate-500">{entry.category_name ?? "Mixed"}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {entries.slice(0, displayedCount).map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white/60 p-3 shadow-sm hover:shadow-md transition sm:gap-4 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-6 text-center font-bold text-slate-700 sm:w-10">{index + 1}</div>
                  <div>
                    <div className="max-w-[110px] truncate font-semibold text-slate-900 sm:max-w-[200px] md:max-w-[300px]">{entry.player_name}</div>
                    <div className="text-xs text-slate-500">{entry.category_name ?? "Mixed"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{entry.score}</div>
                    <div className="text-xs text-slate-500">/{entry.total_questions}</div>
                  </div>
                  <div className="text-sm text-slate-600">{formatTime(entry.completion_time_seconds)}</div>
                </div>
              </div>
            ))}
          </div>
          
          {entries.length > displayedCount && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setDisplayedCount((prev) => prev + 10)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                type="button"
              >
                Load More Players
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
