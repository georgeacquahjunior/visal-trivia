import {
  Activity,
  ArrowRight,
  Award,
  Clock,
  Crown,
  LogOut,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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

  useEffect(() => {
    const savedResults = window.localStorage.getItem(
      `visal_recent_results_${user.id}`,
    );

    setRecentResults(savedResults ? JSON.parse(savedResults) : []);
  }, [user.id]);

  const stats = useMemo(() => {
    if (recentResults.length === 0) {
      return {
        highestScore: 0,
        quizzesPlayed: 0,
        avgTime: 0,
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

    return {
      highestScore,
      quizzesPlayed: recentResults.length,
      avgTime,
    };
  }, [recentResults]);

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        {/* NAV */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl">
              <Sparkles className="size-6 text-violet-300" />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Nexus Trivia
              </h1>
              <p className="text-sm text-white/50">
                Intelligent Quiz Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/80 backdrop-blur-xl transition-all duration-300 hover:bg-white/10"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* HERO */}
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          {/* LEFT */}
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
                {user.picture ? (
                  <img
                    alt={`${user.name} avatar`}
                    className="size-20 rounded-3xl object-cover ring-2 ring-white/20"
                    src={user.picture}
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl font-bold text-white shadow-2xl">
                    {getInitials(user.name)}
                  </div>
                )}

                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    <Crown className="size-3 text-yellow-400" />
                    {user.role ?? "player"}
                  </div>

                  <h2 className="text-4xl font-semibold tracking-tight text-white">
                    Welcome back,
                  </h2>

                  <h3 className="mt-1 text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-white to-white/60 bg-clip-text">
                    {user.name}
                  </h3>
                </div>
              </div>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/60 sm:mx-0">
                Continue your challenge journey, improve your scores, and climb
                the leaderboard with every quiz attempt.
              </p>

              <div className="mt-10 flex flex-col flex-wrap items-center gap-4 sm:flex-row sm:justify-start">
                <button
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-7 text-base font-semibold text-black transition-all duration-300 hover:scale-[1.03] sm:w-auto"
                  onClick={onStartQuiz}
                  type="button"
                >
                  <Play
                    className="size-5 fill-current transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                  Start Quiz
                </button>

                <button
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-7 text-base font-semibold text-white/80 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 sm:w-auto"
                  onClick={onShowLeaderboard}
                  type="button"
                >
                  Leaderboard
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="grid gap-5">
            <StatCard
              icon={<Award className="size-6 text-yellow-300" />}
              label="Highest Score"
              value={`${stats.highestScore}%`}
              glow="from-yellow-500/20 to-orange-500/10"
            />

            <StatCard
              icon={<Activity className="size-6 text-emerald-300" />}
              label="Quizzes Played"
              value={String(stats.quizzesPlayed)}
              glow="from-emerald-500/20 to-cyan-500/10"
            />

            <StatCard
              icon={<Clock className="size-6 text-cyan-300" />}
              label="Average Time"
              value={formatTime(stats.avgTime)}
              glow="from-cyan-500/20 to-blue-500/10"
            />
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="flex-1 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Your latest quiz performance and progress
              </p>
            </div>

            <Button
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white/80 hover:bg-white/10 sm:w-auto"
              onClick={onShowLeaderboard}
              variant="ghost"
            >
              Global Rankings
            </Button>
          </div>

          {recentResults.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/10 text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-white/5">
                <Sparkles className="size-8 text-white/40" />
              </div>

              <h3 className="text-xl font-semibold text-white">
                No quiz activity yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                Start your first challenge and your recent quiz history will
                appear here beautifully.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentResults.slice(0, 6).map((result) => (
                <div
                  className="group flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/10 p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] sm:flex-row sm:gap-0"
                  key={result.id}
                >
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-5 sm:text-left">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl" />

                      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-bold text-white shadow-2xl">
                        {result.percentage}%
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg font-semibold text-white">
                          {result.correctAnswers} Correct
                        </span>

                        <span className="text-white/30">•</span>

                        <span className="text-sm text-red-300">
                          {result.wrongAnswers} Wrong
                        </span>
                      </div>

                      <div className="text-sm text-white/40">
                        {new Date(result.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="text-xl font-semibold tracking-tight text-white">
                      {formatTime(result.timeSpent)}
                    </div>

                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/30">
                      Completion Time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, glow }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${glow}`}
      />

      <div className="relative z-10">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/10">
          {icon}
        </div>

        <p className="text-sm font-medium text-white/50">
          {label}
        </p>

        <h3 className="mt-2 text-4xl font-bold tracking-tight text-white">
          {value}
        </h3>
      </div>
    </div>
  );
}

export default HomePage;
