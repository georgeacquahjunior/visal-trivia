import { ArrowRight, Clock, Copy, Download, Home, Layers, RotateCcw, Sparkles, Target, Trophy, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { checkAnswer, claimPrizeCode, getQuizSettings, startQuiz, submitQuiz } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatTime } from "../utils/format.js";

const DEFAULT_QUIZ_TIME_SECONDS = 150;

function getResultTitle(percentage) {
  if (percentage >= 90) {
    return "Mastermind!";
  }
  if (percentage >= 70) {
    return "Great Job!";
  }
  if (percentage >= 50) {
    return "Not Bad!";
  }
  return "Keep Practicing";
}

function QuizPage({ onDashboard, onShowLeaderboard }) {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [quizSettings, setQuizSettings] = useState({
    question_limit: 7,
    quiz_time_seconds: DEFAULT_QUIZ_TIME_SECONDS,
    attempts_allowed: 3,
    pass_percentage: 70,
    prize_code: "",
  });
  const [remaining, setRemaining] = useState(DEFAULT_QUIZ_TIME_SECONDS);
  const [result, setResult] = useState(null);
  const [answerResults, setAnswerResults] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [prizeCodeMessage, setPrizeCodeMessage] = useState("");
  const [prizeCode, setPrizeCode] = useState("");
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const resultSavedRef = useRef(false);
  const autoStartRef = useRef(false);
  const prizeClaimedRef = useRef(false);

  useEffect(() => {
    if (!result || !user?.id || resultSavedRef.current) {
      return;
    }
    resultSavedRef.current = true;

    const storageKey = `visal_recent_results_${user.id}`;
    const savedResults = window.localStorage.getItem(storageKey);
    const existingResults = savedResults ? JSON.parse(savedResults) : [];
    const nextResult = {
      id: `${Date.now()}-${session.session_id}`,
      score: result.score,
      totalQuestions: result.total_questions,
      percentage: Math.round((result.score / result.total_questions) * 100),
      correctAnswers: result.score,
      wrongAnswers: result.total_questions - result.score,
      timeSpent: result.completion_time_seconds,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify([nextResult, ...existingResults].slice(0, 20)));
  }, [result, session?.session_id, user?.id]);

  const currentQuestion = session?.questions[currentIndex];
  const isLastQuestion = session && currentIndex === session.questions.length - 1;

  useEffect(() => {
    if (!result || !user?.name || !quizSettings?.pass_percentage || prizeClaimedRef.current) {
      return;
    }

    const percentage = Math.round((result.score / result.total_questions) * 100);
    const isWinner = percentage >= (quizSettings.pass_percentage ?? 70);
    if (!isWinner) {
      return;
    }

    prizeClaimedRef.current = true;

    claimPrizeCode({ player_name: user.name })
      .then((entry) => {
        setPrizeCode(entry.code);
        setIsPrizeModalOpen(true);
        setPrizeCodeMessage("Your prize code is ready.");
      })
      .catch(() => {
        setPrizeCodeMessage("Please collect your prize from the admin desk.");
      });
  }, [quizSettings.pass_percentage, result, user?.name]);

  const finishQuiz = useCallback(async () => {
    if (!session || isSubmitting || result) {
      return;
    }
    setIsSubmitting(true);
    setError("");
    const completionTimeSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    const payload = {
      session_id: session.session_id,
      completion_time_seconds: completionTimeSeconds,
      answers: session.questions.map((question) => ({
        question_id: question.id,
        answer: answers[question.id] ?? "",
      })),
    };
    try {
      const response = await submitQuiz(payload);
      setAnswerResults(
        Object.fromEntries(response.results.map((answerResult) => [answerResult.question_id, answerResult])),
      );
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, result, session, startedAt]);

  useEffect(() => {
    if (!session || result || isLoading) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          finishQuiz();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [finishQuiz, isLoading, result, session]);

  const progress = useMemo(() => {
    if (!session) {
      return 0;
    }
    return ((currentIndex + 1) / session.questions.length) * 100;
  }, [currentIndex, session]);

  const beginQuiz = useCallback(async () => {
    if (!user?.name) {
      setError("You must be logged in to start the quiz.");
      setIsLoading(false);
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setError("");
    setResult(null);
    setAnswerResults(null);
    setRevealedAnswer(null);
    setPrizeCodeMessage("");
    setAnswers({});
    try {
      const settings = await getQuizSettings();
      setQuizSettings(settings);
      setRemaining(settings.quiz_time_seconds);
      const response = await startQuiz({
        player_name: user.name,
        category_id: null,
        limit: settings.question_limit,
      });
      setSession(response);
      setCurrentIndex(0);
      setStartedAt(Date.now());
      resultSavedRef.current = false;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }, [user?.name]);

  useEffect(() => {
    if (autoStartRef.current || session || result) {
      return;
    }
    autoStartRef.current = true;
    beginQuiz();
  }, [beginQuiz, result, session]);

  async function selectAnswer(answer) {
    if (revealedAnswer || isSubmitting || !currentQuestion) {
      return;
    }
    setAnswers((current) => ({ ...current, [currentQuestion.id]: answer }));
    setIsSubmitting(true);
    setError("");
    try {
      const checkedAnswer = await checkAnswer({
        question_id: currentQuestion.id,
        answer,
      });
      setAnswerResults((current) => ({
        ...current,
        [currentQuestion.id]: checkedAnswer,
      }));
      setRevealedAnswer(answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const revealedResult = revealedAnswer ? answerResults?.[currentQuestion.id] : null;

  async function handleNext() {
    if (!selectedAnswer || !revealedAnswer) {
      setError("Choose an answer first.");
      return;
    }

    if (isLastQuestion) {
      await finishQuiz();
      return;
    }
    setRevealedAnswer(null);
    setError("");
    setCurrentIndex((index) => index + 1);
  }

  function resetQuiz() {
    setSession(null);
    setResult(null);
    setCurrentIndex(0);
    setAnswers({});
    setStartedAt(null);
    setRemaining(quizSettings.quiz_time_seconds);
    setAnswerResults(null);
    setRevealedAnswer(null);
    setPrizeCodeMessage("");
    setPrizeCode("");
    setIsPrizeModalOpen(false);
    setCopyMessage("");
    prizeClaimedRef.current = false;
    resultSavedRef.current = false;
    autoStartRef.current = false;
  }

  async function copyPrizeCode() {
    if (!prizeCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(prizeCode);
      setCopyMessage("Copied");
    } catch {
      setCopyMessage("Select and copy the code");
    }
  }

  function downloadPrizeCodeImage() {
    if (!prizeCode) return;

    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Visal Trivia Prize", canvas.width / 2, 70);

    // Code
    ctx.fillStyle = "#0066B3";
    ctx.font = "bold 56px monospace";
    ctx.fillText(prizeCode, canvas.width / 2, 140);

    // Footer
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px sans-serif";
    ctx.fillText("Visit our booth on the 3rd floor for your voucher.", canvas.width / 2, 210);

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `prize-code-${prizeCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function closePrizeModal() {
    setIsPrizeModalOpen(false);
    setCopyMessage("");
  }

  if (isLoading) {
    return <LoadingState label="Assembling your challenge" />;
  }

  if (result) {
    const percentage = Math.round((result.score / result.total_questions) * 100);
    const isWinner = percentage >= (quizSettings?.pass_percentage ?? 70);
    return (
      <div className="flex min-h-[calc(100vh-150px)] items-center justify-center p-4 bg-white">
        <div className="glass-card relative w-full max-w-lg overflow-hidden p-8 text-center">
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-[#0066B3] shadow-sm">
              <Trophy className="size-12 text-white" aria-hidden="true" />
            </div>

            <h1 className="mb-2 text-3xl font-black tracking-normal text-slate-900 sm:text-4xl">{getResultTitle(percentage)}</h1>
            <p className="mb-8 font-medium text-slate-500">Here is how you performed.</p>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatBox
                icon={<Target className="size-5 text-rose-500" aria-hidden="true" />}
                label="Accuracy"
                value={`${percentage}%`}
              />
              <StatBox
                icon={<Trophy className="size-5 text-emerald-500" aria-hidden="true" />}
                label="Correct"
                value={result.score}
              />
              <StatBox
                icon={<Clock className="size-5 text-sky-500" aria-hidden="true" />}
                label="Time"
                value={formatTime(result.completion_time_seconds)}
              />
            </div>

            {isWinner && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
                You reached the pass threshold. {prizeCodeMessage || "Preparing your prize code."}
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              {!isWinner && (
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066B3] to-[#0066B3] px-4 py-3 font-bold text-white shadow-lg shadow-[#0066B3]/20 transition-all hover:shadow-xl hover:scale-105"
                  onClick={resetQuiz}
                  type="button"
                >
                  <RotateCcw className="size-5" aria-hidden="true" />
                  Play Again
                </button>
              )}
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md px-4 py-3 font-bold text-slate-700 shadow-sm transition-all hover:shadow-lg hover:border-[#0066B3]"
                onClick={onDashboard}
                type="button"
              >
                <Home className="size-5" aria-hidden="true" />
                Dashboard
              </button>
            </div>

            <button
              className="mt-4 text-sm font-semibold text-[#0066B3] transition hover:text-[#0066B3]"
              onClick={onShowLeaderboard}
              type="button"
            >
              View Global Leaderboard
            </button>
          </div>
        </div>
        {isWinner && prizeCode && isPrizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#0066B3] center ">Prize Unlocked</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 center ">Copy your code now</h2>
                </div>
                <button
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={closePrizeModal}
                  type="button"
                  aria-label="Close prize code"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                <strong className="mb-2 block text-base text-slate-900">Congratulations! Visit our booth on the 3rd floor for your voucher.</strong>
                This code cannot be returned to after this window is closed. Please copy it or take a screenshot.
              </p>
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="break-all text-center font-mono text-2xl font-bold tracking-normal text-slate-950">{prizeCode}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0066B3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0066B3]/90"
                  onClick={copyPrizeCode}
                  type="button"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {copyMessage || "Copy"}
                </button>
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={downloadPrizeCodeImage}
                  type="button"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Save Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!session && error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50">
            <X size={24} className="text-rose-500" aria-hidden="true" />
          </div>
          <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-950">Oops, something went wrong</h3>
          <p className="mb-8 text-sm font-medium text-slate-500">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0066B3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0066B3]/90 disabled:opacity-50"
              onClick={beginQuiz}
              disabled={isSubmitting}
              type="button"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Try Again
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={onDashboard}
              type="button"
            >
              <Home size={16} aria-hidden="true" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <EmptyState title="No questions available" message="Seed or add active questions in the backend database." />;
  }

  const circumference = 263.89;
  const timerProgress = remaining / quizSettings.quiz_time_seconds;

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-1 py-2">
      <div className="mb-8 w-full max-w-3xl">
        <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-widest text-slate-500">
          <span>
            Question {String(currentIndex + 1).padStart(2, "0")} of {session.questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-[#0066B3] to-[#0066B3] shadow-[0_0_10px_rgba(0,102,179,0.5)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="w-full animate-rise-in">
        <div className="mb-6 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
          <div className="flex items-center gap-2 rounded-full border border-[#0066B3]/30 bg-gradient-to-r from-[#0066B3]/10 to-[#0066B3]/10 px-4 py-2 text-sm font-semibold text-[#0066B3] shadow-sm">
            <Layers className="size-4 text-[#0066B3]" aria-hidden="true" />
            Category: {currentQuestion.category}
          </div>

          <div className="relative flex size-24 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
              <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200" />
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - circumference * timerProgress}
                className="text-[#0066B3] transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute text-2xl font-mono font-bold text-slate-900">{formatTime(remaining)}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            <Zap className="size-4 text-emerald-600" aria-hidden="true" />
            Difficulty: {quizSettings?.difficulty || "Standard"}
          </div>
        </div>

        <h2 className="mb-8 px-2 text-center text-2xl font-bold leading-tight tracking-normal text-slate-900 sm:px-10 sm:text-3xl md:text-4xl">
          {currentQuestion.prompt}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const selected = answers[currentQuestion.id] === option;
            const isCorrectOption = revealedResult?.correct_answer === option;
            const isWrongSelection = revealedResult && selected && !revealedResult.is_correct;
            const letter = String.fromCharCode(65 + index);
            return (
              <button
                className={`group relative flex min-h-20 items-center gap-4 overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 sm:min-h-24 sm:gap-5 sm:p-5 ${
                  isCorrectOption
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : isWrongSelection
                      ? "border-rose-500 bg-rose-50 text-rose-900 shadow-[0_0_20px_rgba(244,63,94,0.14)]"
                      : selected
                    ? "border-[#0066B3] bg-[#0066B3]/10 text-[#003F6F] shadow-[0_0_20px_rgba(0,102,179,0.18)]"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-[#0066B3]/50 hover:shadow-md"
                }`}
                disabled={Boolean(revealedAnswer) || isSubmitting}
                key={option}
                onClick={() => selectAnswer(option)}
                type="button"
              >
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl font-bold transition-all ${
                    isCorrectOption
                      ? "bg-emerald-500 text-white"
                      : isWrongSelection
                        ? "bg-rose-500 text-white"
                        : selected
                      ? "bg-[#0066B3] text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-[#0066B3] group-hover:text-white"
                  }`}
                >
                  {letter}
                </span>
                <span className="text-base font-semibold sm:text-lg md:text-xl">{option}</span>
                {!selected && !revealedAnswer && (
                  <span className="absolute right-3 top-3 size-2 rounded-full bg-[#0066B3] opacity-0 shadow-[0_0_8px_rgba(0,102,179,1)] transition-opacity group-hover:opacity-100" />
                )}
                {isCorrectOption && (
                  <span className="absolute right-4 top-4 text-sm font-bold text-emerald-600">Correct</span>
                )}
                {isWrongSelection && (
                  <span className="absolute right-4 top-4 text-sm font-bold text-rose-600">Wrong</span>
                )}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {/* Removed the post-answer info panel to keep the flow focused on the next question. */}

        <div className="mt-8 flex justify-center">
          <button
            className="min-w-[12rem] max-w-[20rem] border border-[#0066B3] bg-white/90 text-[#0066B3] flex items-center justify-between gap-3 px-5 py-3 rounded-full transition hover:shadow-md hover:bg-white"
            disabled={isSubmitting || !revealedAnswer}
            onClick={handleNext}
            type="button"
          >
            <span className="flex-1 text-center text-base font-semibold">{isLastQuestion ? "Submit Score" : "Next Question"}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0066B3] text-white">
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default QuizPage;
