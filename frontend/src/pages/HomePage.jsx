import {
  ArrowRight,
  Layers,
  LogOut,
  Play,
  TrendingUp,
  Zap,
  Award,
  Crown,
  Trophy,
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
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0066B3] text-white">
              <Layers size={24} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-950 sm:text-lg">
                place<span className="text-[#0066B3]">IT</span> Trivia
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">Test your knowledge</p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg p-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:px-4"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-20">
        {/* Welcome Section */}
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 bg items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-500">
              {user.picture ? (
                <img
                  alt={`${user.name} avatar`}
                  className="h-full w-full rounded-full object-cover"
                  src={user.picture}
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Welcome back,</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {user.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${user.role === "admin" ? "bg-slate-100 text-slate-700" : "bg-yellow-100 text-yellow-800"}`}>
                  {user.role === "admin" ? <Crown size={14} aria-hidden="true" /> : <Award size={14} aria-hidden="true" />}
                  <span className="capitalize">{user.role || "player"}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0066B3] px-6 text-sm font-semibold text-white transition hover:bg-[#0066B3]"
              onClick={onStartQuiz}
              type="button"
            >
              <Play size={16} fill="currentColor" />
              Start Quiz
            </button>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-100 px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              onClick={onShowLeaderboard}
              type="button"
            >
              Leaderboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="my-12 grid grid-cols-1 gap-px border-y border-slate-200 bg-slate-200 sm:my-16 sm:grid-cols-2 lg:grid-cols-4">
          {/* Highest Score */}
          <div className="bg-white p-5 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-slate-500">
              <Trophy size={16} />
              <p className="text-xs font-semibold uppercase tracking-widest">Highest Score</p>
            </div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{stats.highestScore}%</p>
            <p className="mt-2 text-sm text-slate-500">{stats.totalQuizzes} {stats.totalQuizzes === 1 ? "quiz" : "quizzes"}</p>
          </div>

          {/* Average Accuracy */}
          <div className="bg-white p-5 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-slate-500">
              <TrendingUp size={16} />
              <p className="text-xs font-semibold uppercase tracking-widest">Avg Accuracy</p>
            </div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{stats.avgAccuracy}%</p>
            <p className="mt-2 text-sm text-slate-500">Last {Math.min(5, stats.totalQuizzes)} quizzes</p>
          </div>

          {/* Current Rank */}
          <div className="bg-white p-5 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-slate-500">
              <Award size={16} />
              <p className="text-xs font-semibold uppercase tracking-widest">Global Rank</p>
            </div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{stats.userRank}</p>
            <p className="mt-2 text-sm text-slate-500">of {stats.totalUsers} players</p>
          </div>

          {/* Avg Time */}
          <div className="bg-white p-5 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-slate-500">
              <Zap size={16} />
              <p className="text-xs font-semibold uppercase tracking-widest">Avg Time</p>
            </div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{formatTime(stats.avgTime)}</p>
            <p className="mt-2 text-sm text-slate-500">per quiz</p>
          </div>
        </div>

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div>
            <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Recent Activity</h2>
            <div className="border-t border-slate-200">
              {recentResults.slice(0, displayedActivityCount).map((result, index) => (
                <div
                  key={result.id || index}
                  className="flex flex-col gap-4 border-b border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 font-bold text-slate-900">
                      {result.percentage}%
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {result.correctAnswers} correct, {result.wrongAnswers} wrong
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-900 sm:text-right">
                    {formatTime(result.timeSpent)}
                  </p>
                </div>
              ))}
            </div>
            
            {recentResults.length > displayedActivityCount && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setDisplayedActivityCount((prev) => prev + 5)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  type="button"
                >
                  Load More Activity
                </button>
              </div>
            )}
          </div>
        )}

        {recentResults.length === 0 && !loading && (
          <div className="border-t border-slate-200 py-16 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Play size={24} className="text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No quiz activity yet</h3>
            <p className="mt-2 text-slate-500">
              Start your first quiz to see your stats and climb the leaderboard!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default HomePage;
