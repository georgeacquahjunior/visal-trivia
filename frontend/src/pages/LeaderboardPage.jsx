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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleEntries = entries.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return <LoadingState label="Loading leaderboard" />;
  }
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Leaderboard</h2>
          <p className="mt-2 text-base text-slate-500">Real-time high scores from players worldwide.</p>
        </div>
        <button
          onClick={loadLeaderboard}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          type="button"
        >
          <RefreshCw size={16} className="transition-transform group-active:rotate-180" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</p>}

      {entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12">
          <EmptyState title="No scores yet" message="Play the first quiz to start the leaderboard." />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
            {entries.slice(0, 3).map((entry, idx) => (
              <div key={entry.id} className="flex flex-col items-center bg-white p-6 text-center sm:p-8">
                <div className="mb-4 flex items-center justify-center gap-2 text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-widest">Rank {idx + 1}</span>
                  <Medal className={idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-600"} size={18} />
                </div>
                <h3 className="w-full truncate text-xl font-bold tracking-tight text-slate-950">{entry.player_name}</h3>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold tracking-tight text-[#0066B3]">{entry.score}</span>
                  <span className="text-sm font-semibold text-slate-500">/{entry.total_questions}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">{entry.category_name ?? "Mixed"}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="w-16 px-6 py-4 text-center text-xs font-semibold uppercase tracking-widest">Rank</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">Player</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-widest">Score</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleEntries.map((entry, index) => (
                    <tr key={entry.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 text-center font-semibold text-slate-500">{startIndex + index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-950">{entry.player_name}</p>
                        <p className="text-xs text-slate-500">{entry.category_name ?? "Mixed"}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-[#0066B3]">{entry.score}</span>
                        <span className="text-xs text-slate-400">/{entry.total_questions}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">
                        {formatTime(entry.completion_time_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-950">{startIndex + 1}</span> to <span className="font-semibold text-slate-950">{Math.min(startIndex + itemsPerPage, entries.length)}</span> of <span className="font-semibold text-slate-950">{entries.length}</span> results
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
