import { Clock, Home, Layers, RotateCcw, Sparkles, Target, Trophy, Zap, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { checkAnswer, getQuizSettings, startQuiz, submitQuiz } from "../api/client.js";
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
  });
  const [remaining, setRemaining] = useState(DEFAULT_QUIZ_TIME_SECONDS);
  const [result, setResult] = useState(null);
  const [answerResults, setAnswerResults] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const resultSavedRef = useRef(false);
  const autoStartRef = useRef(false);

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
    resultSavedRef.current = false;
    autoStartRef.current = false;
  }

  if (isLoading) {
    return <LoadingState label="Assembling your challenge" />;
  }

  if (result) {
    const percentage = Math.round((result.score / result.total_questions) * 100);
    return (
      <div className="flex min-h-[calc(100vh-150px)] items-center justify-center p-4 bg-white">
        <div className="glass-card relative w-full max-w-lg overflow-hidden p-8 text-center">
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-blue-600 shadow-sm">
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

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:scale-105"
                onClick={resetQuiz}
                type="button"
              >
                <RotateCcw className="size-5" aria-hidden="true" />
                Play Again
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md px-4 py-3 font-bold text-slate-700 shadow-sm transition-all hover:shadow-lg hover:border-blue-300"
                onClick={onDashboard}
                type="button"
              >
                <Home className="size-5" aria-hidden="true" />
                Dashboard
              </button>
            </div>

            <button
              className="mt-4 text-sm font-semibold text-blue-600 transition hover:text-blue-500"
              onClick={onShowLeaderboard}
              type="button"
            >
              View Global Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session && error) {
    return (
      <div className="mx-auto max-w-md rounded border border-rose-200 bg-rose-50 p-5 text-center">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <Button className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg" onClick={beginQuiz} disabled={isSubmitting}>
          <Sparkles size={17} aria-hidden="true" />
          Try again
        </Button>
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
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="w-full animate-rise-in">
        <div className="mb-6 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <Layers className="size-4 text-blue-600" aria-hidden="true" />
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
                className="text-blue-600 transition-all duration-1000 ease-linear"
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
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-[0_0_20px_rgba(59,130,246,0.18)]"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-500/50 hover:shadow-md"
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
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-blue-500 group-hover:text-white"
                  }`}
                >
                  {letter}
                </span>
                <span className="text-base font-semibold sm:text-lg md:text-xl">{option}</span>
                {!selected && !revealedAnswer && (
                  <span className="absolute right-3 top-3 size-2 rounded-full bg-blue-500 opacity-0 shadow-[0_0_8px_rgba(59,130,246,1)] transition-opacity group-hover:opacity-100" />
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
            className="min-w-[12rem] max-w-[20rem] border border-blue-300 bg-white/90 text-blue-700 flex items-center justify-between gap-3 px-5 py-3 rounded-full transition hover:shadow-md hover:bg-white"
            disabled={isSubmitting || !revealedAnswer}
            onClick={handleNext}
            type="button"
          >
            <span className="flex-1 text-center text-base font-semibold">{isLastQuestion ? "Submit Score" : "Next Question"}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
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
