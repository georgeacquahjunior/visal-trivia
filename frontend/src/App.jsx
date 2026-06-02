import { BarChart3, Brain } from "lucide-react";
import { useState } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AppShell from "./layouts/AppShell.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";

const baseTabs = [
  { id: "quiz", label: "Play", icon: Brain },
  { id: "leaderboard", label: "Leaderboard", icon: BarChart3 },
];

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("quiz");
  const tabs = baseTabs;

  if (view === "landing") {
    return <LandingPage onDashboard={() => setView("home")} />;
  }

  if (!user) {
    return <LandingPage onDashboard={() => setView("home")} />;
  }

  if (user.role === "admin") {
    return <AdminPage onLogout={() => setView("landing")} />;
  }

  if (view === "home") {
    return (
      <HomePage
        onLogout={() => setView("landing")}
        onShowLeaderboard={() => {
          setActiveTab("leaderboard");
          setView("app");
        }}
        onStartQuiz={() => {
          setActiveTab("quiz");
          setView("app");
        }}
      />
    );
  }

  if (activeTab === "quiz") {
    return (
      <main className="min-h-screen bg-white px-4 py-6 font-sans text-[#1d1d1f] sm:px-6">
        <QuizPage
          onDashboard={() => setView("home")}
          onShowLeaderboard={() => setActiveTab("leaderboard")}
        />
      </main>
    );
  }

  return (
    <AppShell
      tabs={tabs}
      activeTab={activeTab}
      onGoHome={() => setView("home")}
      onTabChange={setActiveTab}
    >
      {activeTab === "leaderboard" && <LeaderboardPage />}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
