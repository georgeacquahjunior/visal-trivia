import {
  Activity,
  BarChart3,
  CheckCircle2,
  Download,
  Edit3,
  FileUp,
  ListChecks,
  LogOut,
  Plus,
  Save,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminCreatePrizeCode,
  adminCreateQuestion,
  adminDeletePrizeCode,
  adminDeleteQuestion,
  adminGetAnalytics,
  adminGetCategories,
  adminGetPrizeCodes,
  adminGetQuestions,
  adminGetSettings,
  adminGetUsers,
  adminImportQuestionsCsv,
  adminUpdateQuestion,
  adminUpdateSettings,
} from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatTime } from "../utils/format.js";

const blankQuestion = {
  category_id: "",
  prompt: "",
  options: ["", "", "", ""],
  correct_answer: "",
  time_limit_seconds: 20,
  is_active: true,
};

const adminScreens = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "User Logins", icon: Users },
  { id: "questions", label: "Questions", icon: ListChecks },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminPage({ onLogout }) {
  const { logout, user } = useAuth();
  const [activeScreen, setActiveScreen] = useState("analytics");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [prizeCodes, setPrizeCodes] = useState([]);
  const [newPrizeCode, setNewPrizeCode] = useState("");
  const [settings, setSettings] = useState({
    question_limit: 7,
    quiz_time_seconds: 150,
    attempts_allowed: 3,
    pass_percentage: 70,
    prize_code: "",
  });
  const [form, setForm] = useState(blankQuestion);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdminData() {
    setIsLoading(true);
    setError("");
    try {
      const [analyticsData, userData, categoryData, questionData, settingsData, prizeCodeData] = await Promise.all([
        adminGetAnalytics(user),
        adminGetUsers(user),
        adminGetCategories(user),
        adminGetQuestions(user),
        adminGetSettings(user),
        adminGetPrizeCodes(user),
      ]);
      setAnalytics(analyticsData);
      setUsers(userData);
      setCategories(categoryData);
      setQuestions(questionData);
      setSettings(settingsData);
      setPrizeCodes(prizeCodeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  function handleLogout() {
    logout();
    onLogout();
  }

  function resetForm() {
    setEditingId(null);
    setForm(blankQuestion);
  }

  function editQuestion(question) {
    setActiveScreen("questions");
    setEditingId(question.id);
    setForm({
      category_id: String(question.category_id),
      prompt: question.prompt,
      options: [...question.options, "", "", "", ""].slice(0, 4),
      correct_answer: question.correct_answer,
      time_limit_seconds: question.time_limit_seconds,
      is_active: question.is_active,
    });
  }

  function updateOption(index, value) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const questionLimit = Number(settings.question_limit);
    const quizTimeSeconds = Number(settings.quiz_time_seconds);
    const attemptsAllowed = Number(settings.attempts_allowed);
    const passPercentage = Number(settings.pass_percentage);
    const prizeCode = String(settings.prize_code ?? "").trim();

    if (!Number.isInteger(questionLimit) || questionLimit < 1 || questionLimit > 50) {
      setError("Questions per quiz must be a whole number from 1 to 50.");
      return;
    }

    if (!Number.isInteger(quizTimeSeconds) || quizTimeSeconds < 30 || quizTimeSeconds > 3600) {
      setError("Quiz time must be a whole number from 30 to 3600 seconds.");
      return;
    }

    if (!Number.isInteger(attemptsAllowed) || attemptsAllowed < 1 || attemptsAllowed > 10) {
      setError("Attempts allowed must be a whole number from 1 to 10.");
      return;
    }

    if (!Number.isInteger(passPercentage) || passPercentage < 1 || passPercentage > 100) {
      setError("Pass percentage must be a whole number from 1 to 100.");
      return;
    }

    try {
      const updated = await adminUpdateSettings(user, {
        question_limit: questionLimit,
        quiz_time_seconds: quizTimeSeconds,
        attempts_allowed: attemptsAllowed,
        pass_percentage: passPercentage,
        prize_code: prizeCode,
      });
      setSettings(updated);
      setMessage("Quiz settings saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addPrizeCode(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const code = newPrizeCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a prize code before adding it.");
      return;
    }

    try {
      const created = await adminCreatePrizeCode(user, { code });
      setPrizeCodes((current) => [created, ...current]);
      setNewPrizeCode("");
      setMessage("Prize code added.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePrizeCode(prizeCodeId) {
    try {
      await adminDeletePrizeCode(user, prizeCodeId);
      setPrizeCodes((current) => current.filter((entry) => entry.id !== prizeCodeId));
      setMessage("Prize code deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveQuestion(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      options: form.options.map((option) => option.trim()).filter(Boolean),
      correct_answer: form.correct_answer.trim(),
      time_limit_seconds: Number(form.time_limit_seconds),
    };

    try {
      if (editingId) {
        await adminUpdateQuestion(user, editingId, payload);
        setMessage("Question updated.");
      } else {
        await adminCreateQuestion(user, payload);
        setMessage("Question added.");
      }
      resetForm();
      loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteQuestion(questionId) {
    setError("");
    setMessage("");
    try {
      await adminDeleteQuestion(user, questionId);
      setMessage("Question deleted.");
      loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function importQuestionsCsv(file) {
    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsImporting(true);
    try {
      const result = await adminImportQuestionsCsv(user, file);
      const skippedText = result.skipped ? ` ${result.skipped} skipped.` : "";
      const errorText = result.errors?.length ? ` ${result.errors.slice(0, 3).join(" ")}` : "";
      setMessage(`${result.created} question${result.created === 1 ? "" : "s"} imported.${skippedText}${errorText}`);
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading admin dashboard" />;
  }

  return (
    <div className="flex h-screen flex-col bg-white font-sans text-slate-950 overflow-hidden md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4 sm:px-6">
          <h1 className="text-lg font-bold tracking-tight text-slate-950">
            place<span className="text-[#0066B3]">IT</span> Admin
          </h1>
          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 md:hidden" onClick={handleLogout} type="button" aria-label="Logout">
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex space-x-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-1 md:flex-col md:space-x-0 md:space-y-2 md:overflow-y-auto md:py-6">
          {adminScreens.map((screen) => {
            const Icon = screen.icon;
            const isActive = activeScreen === screen.id;
            return (
              <button
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors md:w-full md:py-3 ${
                  isActive ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                }`}
                key={screen.id}
                onClick={() => setActiveScreen(screen.id)}
                type="button"
              >
                <Icon className={isActive ? "text-slate-950" : "text-slate-400"} size={18} strokeWidth={2} aria-hidden="true" />
                {screen.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden border-t border-slate-100 p-4 md:block">
          <div className="mb-4 flex items-center gap-3 px-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-sm font-semibold text-slate-950">{user.name}</span>
              <span className="truncate text-xs text-slate-500">Administrator</span>
            </div>
          </div>
          <button className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600" onClick={handleLogout} type="button">
            <LogOut className="text-slate-400 group-hover:text-rose-600" size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white p-4 sm:p-6 md:p-8 lg:p-12">

        {activeScreen === "analytics" && (
          <AnalyticsScreen analytics={analytics} />
        )}
        {activeScreen === "users" && <UsersScreen users={users} />}
        {activeScreen === "questions" && (
          <QuestionsScreen
            categories={categories}
            deleteQuestion={deleteQuestion}
            editQuestion={editQuestion}
            editingId={editingId}
            form={form}
            importQuestionsCsv={importQuestionsCsv}
            isImporting={isImporting}
            questions={questions}
            resetForm={resetForm}
            saveQuestion={saveQuestion}
            setForm={setForm}
            updateOption={updateOption}
          />
        )}
        {activeScreen === "settings" && (
          <SettingsScreen
            addPrizeCode={addPrizeCode}
            deletePrizeCode={deletePrizeCode}
            newPrizeCode={newPrizeCode}
            prizeCodes={prizeCodes}
            saveSettings={saveSettings}
            setNewPrizeCode={setNewPrizeCode}
            setSettings={setSettings}
            settings={settings}
          />
        )}
      </main>

      {/* Toast Notifications */}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm">
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-toast {
            animation: toastSlideIn 0.3s ease-out forwards;
          }
        `}</style>
        {error && (
          <div className="animate-toast pointer-events-auto flex items-start justify-between rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-lg ring-1 ring-rose-500/20">
            <span className="mt-0.5">{error}</span>
            <button onClick={() => setError("")} className="ml-4 shrink-0 rounded-lg p-1 transition hover:bg-rose-100" type="button" aria-label="Dismiss">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        {message && (
          <div className="animate-toast pointer-events-auto flex items-start justify-between rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-lg ring-1 ring-emerald-500/20">
            <span className="mt-0.5">{message}</span>
            <button onClick={() => setMessage("")} className="ml-4 shrink-0 rounded-lg p-1 transition hover:bg-emerald-100" type="button" aria-label="Dismiss">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsScreen({ analytics }) {
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    // Slight delay so the animation smoothly triggers after mounting
    const timer = setTimeout(() => setShowChart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const cards = [
    { label: "Questions", value: analytics?.total_questions ?? 0, icon: ListChecks },
    { label: "Active", value: analytics?.active_questions ?? 0, icon: CheckCircle2 },
    { label: "Players", value: analytics?.total_players ?? 0, icon: Users },
    { label: "Logins", value: analytics?.total_logins ?? 0, icon: Users },
    { label: "Completed", value: analytics?.completed_sessions ?? 0, icon: Activity },
  ];

  const funnelData = [
    { label: "Total Logins", value: analytics?.total_logins ?? 0, color: "bg-slate-800" },
    { label: "Unique Players", value: analytics?.total_players ?? 0, color: "bg-[#0066B3]" },
    { label: "Quizzes Finished", value: analytics?.completed_sessions ?? 0, color: "bg-sky-400" },
  ];
  const maxFunnel = Math.max(...funnelData.map((d) => d.value), 1);

  return (
    <section className="grid gap-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Analytics Overview</h2>
        <p className="mt-2 text-base text-slate-500">Key metrics and performance indicators.</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="bg-white p-4 sm:p-6 lg:p-8" key={card.label}>
              <div className="mb-4 flex items-center gap-2 text-slate-500">
                <Icon size={16} aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-widest">{card.label}</p>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 lg:grid-cols-3">
        <div className="bg-white p-6 lg:col-span-2 sm:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold tracking-tight text-slate-950">Engagement Funnel</h3>
            <p className="mt-1 text-sm text-slate-500">Player conversion from login to quiz completion</p>
          </div>
          <div className="flex h-56 items-end justify-around gap-4 pt-6 sm:gap-8">
            {funnelData.map((item) => (
              <div key={item.label} className="group flex h-full w-full flex-col items-center justify-end gap-3">
                <div className="relative flex w-full max-w-[120px] flex-1 flex-col justify-end bg-slate-50">
                  <div
                    className={`w-full ${item.color} transition-all duration-1000 ease-out`}
                    style={{ height: showChart ? `${Math.max((item.value / maxFunnel) * 100, 4)}%` : "0%" }}
                  />
                  <span className="absolute -top-6 w-full text-center text-sm font-bold text-slate-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.value}
                  </span>
                </div>
                <span className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-px bg-slate-200">
          <div className="bg-white p-4 sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Average Score</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{analytics?.average_score_percent ?? 0}%</p>
          </div>
          <div className="bg-white p-4 sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Average Time</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              {formatTime(analytics?.average_completion_time_seconds ?? 0)}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Inactive Questions</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              {analytics?.inactive_questions ?? 0}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UsersScreen({ users }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleUsers = users.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="flex h-full flex-col max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">User Logins</h2>
        <p className="mt-2 text-base text-slate-500">List of users who have signed in via Google.</p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        {users.length === 0 ? (
          <div className="p-12"><EmptyState title="No logins yet" message="Google sign-ins will appear here after users log in." /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleUsers.map((entry) => (
                    <tr key={entry.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {entry.picture ? (
                            <img alt="" className="size-10 rounded-full bg-slate-100 object-cover" src={entry.picture} />
                          ) : (
                            <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                              {entry.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="font-semibold text-slate-950">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{entry.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${entry.role === "admin" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{new Date(entry.logged_in_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:px-6">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-950">{startIndex + 1}</span> to <span className="font-semibold text-slate-950">{Math.min(startIndex + itemsPerPage, users.length)}</span> of <span className="font-semibold text-slate-950">{users.length}</span> results
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
          </>
        )}
        </div>
    </section>
  );
}

function QuestionsScreen({
  categories,
  deleteQuestion,
  editQuestion,
  editingId,
  form,
  importQuestionsCsv,
  isImporting,
  questions,
  resetForm,
  saveQuestion,
  setForm,
  updateOption,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(questions.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleQuestions = questions.slice(startIndex, startIndex + itemsPerPage);

  function downloadTemplate() {
    const csv = [
      "category,prompt,option_1,option_2,option_3,option_4,option_5,option_6,correct_answer,time_limit_seconds,is_active",
      "Science,What planet is known as the Red Planet?,Mars,Venus,Jupiter,Saturn,,,Mars,20,true",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "visal-trivia-question-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="flex h-full flex-col gap-10 xl:flex-row max-w-[1400px] mx-auto">
      <div className="w-full shrink-0 xl:w-[400px]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{editingId ? "Edit Question" : "Add Question"}</h2>
          <p className="mt-2 text-base text-slate-500">Create or modify a trivia question.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8">
          <form className="grid gap-5" onSubmit={saveQuestion}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Category</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                required
                value={form.category_id}
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Prompt</label>
              <textarea
                className="min-h-[100px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
                placeholder="Question text"
                required
                value={form.prompt}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {form.options.map((option, index) => (
                <div key={index}>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                    value={option}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Correct Answer</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                onChange={(event) => setForm((current) => ({ ...current, correct_answer: event.target.value }))}
                placeholder="Must match one option"
                required
                value={form.correct_answer}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Time (sec)</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                  max="120"
                  min="5"
                  onChange={(event) => setForm((current) => ({ ...current, time_limit_seconds: event.target.value }))}
                  type="number"
                  value={form.time_limit_seconds}
                />
              </div>
              <div className="flex items-center pt-7">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    checked={form.is_active}
                    className="size-4 rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                    type="checkbox"
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="flex-1 rounded-full bg-[#0066B3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0066B3]" type="submit">
                {editingId ? "Save" : "Add"}
              </button>
              {editingId && (
                <button onClick={resetForm} className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" type="button">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Question Bank</h2>
            <p className="mt-2 text-base text-slate-500">Manage all questions.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={downloadTemplate}
              type="button"
            >
              <Download size={16} />
              Template
            </button>
            <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0066B3] px-6 text-sm font-semibold text-white transition hover:bg-[#0066B3]">
              <FileUp size={16} />
              {isImporting ? "Importing..." : "Import CSV"}
              <input
                accept=".csv,text/csv"
                className="sr-only"
                disabled={isImporting}
                onChange={(event) => {
                  importQuestionsCsv(event.target.files?.[0]);
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          {questions.length === 0 ? (
            <div className="p-12"><EmptyState title="No questions yet" message="Add your first question to start building the quiz." /></div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="w-[15%] px-6 py-4 text-xs font-semibold uppercase tracking-widest">Category</th>
                      <th className="w-[60%] px-6 py-4 text-xs font-semibold uppercase tracking-widest">Prompt</th>
                      <th className="w-[25%] px-6 py-4 text-right text-xs font-semibold uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleQuestions.map((q) => (
                      <tr key={q.id} className="group transition-colors hover:bg-slate-50">
                        <td className="align-top px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                            {q.category?.name ?? "None"}
                          </span>
                        </td>
                        <td className="align-top px-6 py-5">
                          <p className="mb-1 text-base font-semibold text-slate-950">{q.prompt}</p>
                          <p className="text-xs text-slate-500">Answer: {q.correct_answer}</p>
                        </td>
                        <td className="align-top px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => editQuestion(q)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0066B3]" title="Edit" type="button">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => deleteQuestion(q.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600" title="Delete" type="button">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:px-6">
                  <p className="text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-950">{startIndex + 1}</span> to <span className="font-semibold text-slate-950">{Math.min(startIndex + itemsPerPage, questions.length)}</span> of <span className="font-semibold text-slate-950">{questions.length}</span> results
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function SettingsScreen({ addPrizeCode, deletePrizeCode, newPrizeCode, prizeCodes, saveSettings, setNewPrizeCode, setSettings, settings }) {
  return (
    <section className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Quiz Settings</h2>
        <p className="mt-2 text-base text-slate-500">Configure global gameplay parameters.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 md:p-10">
        <div className="space-y-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Questions per quiz</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                max="50" min="1" required step="1"
                onChange={(event) => setSettings((current) => ({ ...current, question_limit: event.target.value }))}
                type="number" value={settings.question_limit}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Quiz time in seconds</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                max="3600" min="30" required step="1"
                onChange={(event) => setSettings((current) => ({ ...current, quiz_time_seconds: event.target.value }))}
                type="number" value={settings.quiz_time_seconds}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Attempts allowed</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                max="10" min="1" required step="1"
                onChange={(event) => setSettings((current) => ({ ...current, attempts_allowed: event.target.value }))}
                type="number" value={settings.attempts_allowed ?? 3}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Pass percentage (%)</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                max="100" min="1" required step="1"
                onChange={(event) => setSettings((current) => ({ ...current, pass_percentage: event.target.value }))}
                type="number" value={settings.pass_percentage ?? 70}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Prize code (optional)</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:bg-white focus:ring-2 focus:ring-[#0066B3]/15"
                maxLength="120"
                onChange={(event) => setSettings((current) => ({ ...current, prize_code: event.target.value }))}
                placeholder="e.g. WIN-2048" type="text" value={settings.prize_code ?? ""}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6 md:p-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">Prize codes</h3>
                <p className="text-sm text-slate-500">Add multiple codes and delete used ones. Existing codes cannot be edited.</p>
              </div>
            </div>
            <form className="mb-6 flex gap-3" onSubmit={addPrizeCode}>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/15"
                onChange={(event) => setNewPrizeCode(event.target.value)}
                placeholder="e.g. WIN-2048"
                type="text"
                value={newPrizeCode}
              />
              <button className="rounded-full bg-[#0066B3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0066B3]" type="submit">Add</button>
            </form>
            <div className="grid gap-3">
              {prizeCodes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">No prize codes yet.</p>
              ) : prizeCodes.map((item) => (
                <div key={item.id} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.code}</p>
                    <p className="text-xs text-slate-500">{item.is_used ? `Claimed by ${item.claimed_by || "a player"}` : "Available to award"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_used ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.is_used ? "✓ Used" : "Unused"}
                    </span>
                    <button className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => deletePrizeCode(item.id)} type="button" title="Delete code">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-8">
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0066B3] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0066B3]" onClick={saveSettings} type="button">
              <Save size={16} aria-hidden="true" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminPage;
