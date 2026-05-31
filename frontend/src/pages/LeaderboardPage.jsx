import { Medal, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { getLeaderboard } from "../api/client.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
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
    <Card>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Top players</p>
          <h2 className="text-2xl font-bold">Leaderboard</h2>
        </div>
        <Button onClick={loadLeaderboard} variant="secondary">
          <RefreshCw size={17} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error && <p className="mb-4 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {entries.length === 0 ? (
        <EmptyState title="No scores yet" message="Play the first quiz to start the leaderboard." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="py-3 pr-3 font-semibold">Rank</th>
                <th className="py-3 pr-3 font-semibold">Player</th>
                <th className="py-3 pr-3 font-semibold">Score</th>
                <th className="py-3 pr-3 font-semibold">Time</th>
                <th className="py-3 pr-3 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr className="border-b border-zinc-100" key={entry.id}>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      {index < 3 && <Medal className="text-amber-500" size={16} aria-hidden="true" />}
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-semibold text-zinc-900">{entry.player_name}</td>
                  <td className="py-3 pr-3">
                    {entry.score}/{entry.total_questions}
                  </td>
                  <td className="py-3 pr-3">{formatTime(entry.completion_time_seconds)}</td>
                  <td className="py-3 pr-3 text-zinc-600">{entry.category_name ?? "Mixed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default LeaderboardPage;
