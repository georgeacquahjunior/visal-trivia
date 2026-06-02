import {
  ArrowRight,
  Layers,
  LogOut,
  Play,
  TrendingUp,
  Zap,
  Award,
  Crown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { getLeaderboard } from "../api/client.js";
import { formatTime } from "../utils/format.js";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function HomePage({
  onLogout,
  onStartQuiz,
  onShowLeaderboard,
}) {
  const { logout, user } = useAuth();
  const [recentResults, setRecentResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayedActivityCount, setDisplayedActivityCount] = useState(5);

  useEffect(() => {
    const savedResults = window.localStorage.getItem(
      `visal_recent_results_${user.id}`,
    );

    setRecentResults(savedResults ? JSON.parse(savedResults) : []);
  }, [user.id]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await getLeaderboard(100);
        setLeaderboard(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const stats = useMemo(() => {
    if (recentResults.length === 0) {
      return {
        highestScore: 0,
        totalQuizzes: 0,
        avgTime: 0,
        avgAccuracy: 0,
        userRank: "-",
        totalUsers: leaderboard.length,
      };
    }

    const highestScore = Math.max(
      ...recentResults.map((result) => result.percentage),
    );

    const avgTime = Math.round(
      recentResults.reduce(
        (total, result) => total + result.timeSpent,
        0,
      ) / recentResults.length,
    );

    const avgAccuracy = Math.round(
      recentResults.reduce(
        (total, result) => total + result.percentage,
        0,
      ) / recentResults.length,
    );

    // Find user rank in leaderboard by matching name or ID
    const userRank = leaderboard.findIndex(
      (entry) => entry.player_name === user.name || entry.player_id === user.id
    ) + 1;

    return {
      highestScore,
      totalQuizzes: recentResults.length,
      avgTime,
      avgAccuracy,
      userRank: userRank > 0 ? `#${userRank}` : "-",
      totalUsers: leaderboard.length,
    };
  }, [recentResults, leaderboard, user.name, user.id]);

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 sm:px-8 sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <Layers size={24} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-950 sm:text-lg">place<span className="text-blue-500">IT</span> Trivia</p>
              <p className="hidden text-xs text-slate-500 sm:block">Test your knowledge</p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg p-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:px-4"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
        {/* Welcome Section */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur-md sm:p-8">
          <div className="mb-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-4xl font-bold text-white shadow-lg sm:h-20 sm:w-20 sm:text-3xl">
              {user.picture ? (
                <img
                  alt={`${user.name} avatar`}
                  className="h-full w-full rounded-2xl object-cover"
                  src={user.picture}
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Welcome back
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  {user.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 shadow-sm">
                  {user.role === "admin" ? <Crown size={14} aria-hidden="true" /> : <Award size={14} color="gold" aria-hidden="true" />}
                  {user.role || "Player"}
                </span>
              </div>
              <p className="mt-3 text-base leading-6 text-slate-600">
                Keep improving your scores and climb the leaderboard with every quiz you take.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105"
              onClick={onStartQuiz}
              type="button"
            >
              <Play size={18} fill="currentColor" />
              Start Quiz
            </button>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 font-semibold text-slate-950 transition hover:bg-slate-50"
              onClick={onShowLeaderboard}
              type="button"
            >
              Leaderboard
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Highest Score */}
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Highest Score
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Trophy size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-950">{stats.highestScore}%</p>
            <p className="mt-2 text-sm text-slate-500">
              {stats.totalQuizzes} {stats.totalQuizzes === 1 ? "quiz" : "quizzes"}
            </p>
          </div>

          {/* Average Accuracy */}
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Avg Accuracy
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-950">{stats.avgAccuracy}%</p>
            <p className="mt-2 text-sm text-slate-500">Last {Math.min(5, stats.totalQuizzes)} quizzes</p>
          </div>

          {/* Current Rank */}
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Global Rank
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Award size={18} className="text-yellow-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-950">{stats.userRank}</p>
            <p className="mt-2 text-sm text-slate-500">of {stats.totalUsers} players</p>
          </div>

          {/* Avg Time */}
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Avg Time
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Zap size={18} className="text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-950">{formatTime(stats.avgTime)}</p>
            <p className="mt-2 text-sm text-slate-500">per quiz</p>
          </div>
        </div>

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-md p-6">
            <h2 className="text-xl font-bold text-slate-950 mb-6">Recent Activity</h2>
            <div className="space-y-3">
              {recentResults.slice(0, displayedActivityCount).map((result, index) => (
                <div
                  key={result.id || index}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-600">
                      {result.percentage}%
                    </div>
                    <div>
                      <p className="font-medium text-slate-950">
                        {result.correctAnswers} correct, {result.wrongAnswers} wrong
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatTime(result.timeSpent)}
                  </p>
                </div>
              ))}
            </div>
            
            {recentResults.length > displayedActivityCount && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setDisplayedActivityCount((prev) => prev + 5)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  type="button"
                >
                  Load More Activity
                </button>
              </div>
            )}
          </div>
        )}

        {recentResults.length === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 backdrop-blur-md p-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <Play size={32} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-950">No quiz activity yet</h3>
            <p className="mt-2 text-slate-600">
              Start your first quiz to see your stats and climb the leaderboard!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// Trophy icon component
function Trophy(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2" />
      <path d="M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" />
      <path d="M12 12v4" />
      <path d="M9 21h6" />
    </svg>
  );
}

export default HomePage;
