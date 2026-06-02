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

  async function loadLeaderboard() {
    setIsLoading(true);
    setError("");
    try {
      setEntries(await getLeaderboard(20));
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
    <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-600/80">Top players</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Leaderboard</h2>
          <p className="mt-1 text-sm text-slate-500">Real-time high scores from players worldwide</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLeaderboard}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 active:scale-95"
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
                <div className="text-indigo-600 font-extrabold text-2xl">{entry.score}<span className="text-slate-400 text-sm">/{entry.total_questions}</span></div>
                <div className="mt-2 text-xs text-slate-500">{entry.category_name ?? "Mixed"}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white/60 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 text-center font-bold text-slate-700">{index + 1}</div>
                  <div>
                    <div className="font-semibold text-slate-900">{entry.player_name}</div>
                    <div className="text-xs text-slate-500">{entry.category_name ?? "Mixed"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-indigo-600">{entry.score}</div>
                    <div className="text-xs text-slate-500">/{entry.total_questions}</div>
                  </div>
                  <div className="text-sm text-slate-600">{formatTime(entry.completion_time_seconds)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
