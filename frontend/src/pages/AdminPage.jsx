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
  adminCreateQuestion,
  adminDeleteQuestion,
  adminGetAnalytics,
  adminGetCategories,
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
  const [settings, setSettings] = useState({ question_limit: 7, quiz_time_seconds: 150 });
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
      const [analyticsData, userData, categoryData, questionData, settingsData] = await Promise.all([
        adminGetAnalytics(user),
        adminGetUsers(user),
        adminGetCategories(user),
        adminGetQuestions(user),
        adminGetSettings(user),
      ]);
      setAnalytics(analyticsData);
      setUsers(userData);
      setCategories(categoryData);
      setQuestions(questionData);
      setSettings(settingsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

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

    if (!Number.isInteger(questionLimit) || questionLimit < 1 || questionLimit > 50) {
      setError("Questions per quiz must be a whole number from 1 to 50.");
      return;
    }

    if (!Number.isInteger(quizTimeSeconds) || quizTimeSeconds < 30 || quizTimeSeconds > 3600) {
      setError("Quiz time must be a whole number from 30 to 3600 seconds.");
      return;
    }

    try {
      const updated = await adminUpdateSettings(user, {
        question_limit: questionLimit,
        quiz_time_seconds: quizTimeSeconds,
      });
      setSettings(updated);
      setMessage("Quiz settings saved.");
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 font-sans text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-base font-bold uppercase tracking-wide text-indigo-600/80">Admin Dashboard</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Visal Trivia Control Center</h1>
              <p className="mt-3 text-base font-medium text-slate-500">Signed in as {user.name}</p>
            </div>
            <button
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-100 px-6 text-sm font-semibold text-slate-700 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={18} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              Logout
            </button>
          </div>

          <nav className="mt-8 flex flex-wrap gap-2 sm:gap-3">
            {adminScreens.map((screen) => {
              const Icon = screen.icon;
              const isActive = activeScreen === screen.id;
              return (
                <button
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-200 ${
                    isActive ? "scale-[1.02] bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200" : "bg-transparent text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                  key={screen.id}
                  onClick={() => setActiveScreen(screen.id)}
                  type="button"
                >
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  {screen.label}
                </button>
              );
            })}
          </nav>
        </header>

        {(error || message) && (
          <div className="mb-4 grid gap-3">
            {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</p>}
            {message && (
              <p className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">{message}</p>
            )}
          </div>
        )}

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
          <SettingsScreen saveSettings={saveSettings} setSettings={setSettings} settings={settings} />
        )}
      </div>
    </main>
  );
}

function AnalyticsScreen({ analytics }) {
  const cards = [
    { label: "Total Questions", value: analytics?.total_questions ?? 0, icon: ListChecks },
    { label: "Active Questions", value: analytics?.active_questions ?? 0, icon: CheckCircle2 },
    { label: "Players", value: analytics?.total_players ?? 0, icon: Users },
    { label: "User Logins", value: analytics?.total_logins ?? 0, icon: Users },
    { label: "Completed Sessions", value: analytics?.completed_sessions ?? 0, icon: Activity },
  ];

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8" key={card.label}>
              <div className="mb-6 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold tracking-tight text-slate-500">{card.label}</span>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
              </div>
              <p className="text-5xl font-bold tracking-tight text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold tracking-tight text-slate-500">Average Score</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-900">{analytics?.average_score_percent ?? 0}%</p>
        </div>
        <div className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold tracking-tight text-slate-500">Average Time</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-900">
            {formatTime(analytics?.average_completion_time_seconds ?? 0)}
          </p>
        </div>
        <div className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold tracking-tight text-slate-500">Inactive Questions</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-900">
            {analytics?.inactive_questions ?? 0}
          </p>
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
    <section className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-600/80">User Login List</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Google sign-ins</h2>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No logins yet" message="Google sign-ins will appear here after users log in." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-4 pr-4">Name</th>
                <th className="pb-4 pr-4">Email</th>
                <th className="pb-4 pr-4">Role</th>
                <th className="pb-4 pr-4">Login Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {visibleUsers.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-white/40">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-4">
                      {entry.picture ? (
                        <img alt="" className="size-10 rounded-full object-cover shadow-sm ring-2 ring-white" src={entry.picture} />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 shadow-sm ring-2 ring-white">
                          {entry.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("")}
                        </span>
                      )}
                      <span className="font-semibold text-slate-900">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{entry.email}</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {entry.role}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{new Date(entry.logged_in_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, users.length)} of {users.length} entries
          </p>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-100"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              type="button"
            >
              Previous
            </button>
            <button
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-100"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      )}
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
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8 h-fit">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-600/80">Question Editor</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{editingId ? "Edit question" : "Add question"}</h2>
          </div>
          {editingId && (
            <button onClick={resetForm} type="button" className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95">
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
              Cancel
            </button>
          )}
        </div>

        <form className="grid gap-5" onSubmit={saveQuestion}>
          <select
            className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
            onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
            required
            value={form.category_id}
          >
            <option value="" disabled>Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <textarea
            className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
            onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
            placeholder="Question"
            required
            value={form.prompt}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {form.options.map((option, index) => (
              <input
                className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
                key={index}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                required
                value={option}
              />
            ))}
          </div>

          <input
            className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
            onChange={(event) => setForm((current) => ({ ...current, correct_answer: event.target.value }))}
            placeholder="Correct answer"
            required
            value={form.correct_answer}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Time limit (sec)</label>
              <input
                className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
                max="120"
                min="5"
                onChange={(event) => setForm((current) => ({ ...current, time_limit_seconds: event.target.value }))}
                type="number"
                value={form.time_limit_seconds}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 pt-8 text-sm font-semibold text-slate-700">
              <input
                checked={form.is_active}
                className="size-5 rounded-md border-slate-300 accent-indigo-600"
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                type="checkbox"
              />
              Active
            </label>
          </div>

          <button className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-95 sm:w-max" type="submit">
            <Plus size={20} strokeWidth={1.5} aria-hidden="true" />
            {editingId ? "Save question" : "Add question"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-600/80">Question Bank</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Manage questions</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-slate-50 active:scale-95"
              onClick={downloadTemplate}
              type="button"
            >
              <Download size={16} strokeWidth={1.5} aria-hidden="true" />
              CSV Template
            </button>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-95">
              <FileUp size={16} strokeWidth={1.5} aria-hidden="true" />
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

        {questions.length === 0 ? (
          <EmptyState title="No questions yet" message="Add your first question to start building the quiz." />
        ) : (
          <div className="space-y-4">
            {visibleQuestions.map((question) => (
              <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 transition-all" key={question.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
                      {question.category?.name ?? "Category"}
                    </p>
                    <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">{question.prompt}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">Answer: {question.correct_answer}</p>
                  </div>
                  <div className="flex gap-3 sm:mt-0 mt-4">
                    <button onClick={() => editQuestion(question)} type="button" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-all hover:bg-slate-50 active:scale-95">
                      <Edit3 size={16} strokeWidth={1.5} aria-hidden="true" />
                      Edit
                    </button>
                    <button onClick={() => deleteQuestion(question.id)} type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100 active:scale-95">
                      <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-4 sm:flex-row">
                <p className="text-sm text-slate-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, questions.length)} of {questions.length} entries
                </p>
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-100"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-100"
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
        )}
      </div>
    </section>
  );
}

function SettingsScreen({ saveSettings, setSettings, settings }) {
  return (
    <section className="max-w-2xl rounded-3xl border-0 bg-white/70 p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-600/80">Settings</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Quiz controls</h2>
      </div>

      <form className="grid gap-6" onSubmit={saveSettings}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Questions per quiz</label>
          <input
            className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
            max="50"
            min="1"
            required
            step="1"
            onChange={(event) => setSettings((current) => ({ ...current, question_limit: event.target.value }))}
            type="number"
            value={settings.question_limit}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Quiz time in seconds</label>
          <input
            className="w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
            max="3600"
            min="30"
            required
            step="1"
            onChange={(event) => setSettings((current) => ({ ...current, quiz_time_seconds: event.target.value }))}
            type="number"
            value={settings.quiz_time_seconds}
          />
        </div>
        <button className="group mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-95 sm:w-max" type="submit">
          <Save size={20} strokeWidth={1.5} aria-hidden="true" />
          Save settings
        </button>
      </form>
    </section>
  );
}

export default AdminPage;
