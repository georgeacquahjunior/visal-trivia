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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-600/80">Top players</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Leaderboard</h2>
        </div>
        <button onClick={loadLeaderboard} className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95" type="button">
          <RefreshCw size={16} strokeWidth={1.5} className="transition-transform group-active:rotate-180" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</p>}

      {entries.length === 0 ? (
        <EmptyState title="No scores yet" message="Play the first quiz to start the leaderboard." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-4 pr-4">Rank</th>
                <th className="pb-4 pr-4">Player</th>
                <th className="pb-4 pr-4">Score</th>
                <th className="pb-4 pr-4">Time</th>
                <th className="pb-4 pr-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {entries.map((entry, index) => (
                <tr className="transition-colors hover:bg-white/40" key={entry.id}>
                  <td className="py-4 pr-4">
                    <span className="inline-flex items-center gap-2 font-bold text-slate-900">
                      {index === 0 && <Medal className="text-yellow-500" size={18} strokeWidth={2} aria-hidden="true" />}
                      {index === 1 && <Medal className="text-slate-400" size={18} strokeWidth={2} aria-hidden="true" />}
                      {index === 2 && <Medal className="text-amber-600" size={18} strokeWidth={2} aria-hidden="true" />}
                      {index > 2 && <span className="w-[18px] text-center text-slate-400">{index + 1}</span>}
                      {index < 3 && <span>{index + 1}</span>}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-semibold text-slate-900">{entry.player_name}</td>
                  <td className="py-4 pr-4 font-bold text-indigo-600">
                    {entry.score}<span className="text-slate-400">/{entry.total_questions}</span>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{formatTime(entry.completion_time_seconds)}</td>
                  <td className="py-4 pr-4">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-indigo-600">
                      {entry.category_name ?? "Mixed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
