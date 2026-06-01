import { Brain, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn.js";

function LandingPage({ onDashboard }) {
  const { loginWithGoogleCredential, user } = useAuth();
  const googleButtonRef = useRef(null);
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleCredential = useCallback(
    async (credential) => {
      setIsSigningIn(true);
      setError("");
      try {
        await loginWithGoogleCredential(credential);
        onDashboard();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSigningIn(false);
      }
    },
    [loginWithGoogleCredential, onDashboard],
  );

  const handleError = useCallback((message) => {
    setError(message);
  }, []);

  const { clientId, isReady } = useGoogleSignIn({
    buttonRef: googleButtonRef,
    onCredential: handleCredential,
    onError: handleError,
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 text-center font-sans text-slate-900">

      <section className="relative z-10 flex max-w-3xl flex-col items-center">
        <div className="mb-8 flex items-center justify-center rounded-3xl bg-white p-5 shadow-xl shadow-indigo-100/50">
          <Brain className="size-16 text-indigo-600" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h1 className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Visal Trivia.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg font-medium tracking-tight text-slate-600 sm:text-xl md:text-2xl">
          The ultimate general knowledge showdown. Test your brain, climb the leaderboard, and prove you're the smartest in the room.
        </p>

        {user ? (
          <button
            className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:from-indigo-500 hover:to-purple-500 active:scale-95 sm:w-auto sm:text-lg"
            onClick={onDashboard}
            type="button"
          >
            <span>Go to Dashboard</span>
            <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        ) : (
          <div className="flex w-full flex-col items-center gap-4 sm:w-auto">
            {clientId ? (
              <>
                <div className={`flex min-h-11 min-w-64 items-center justify-center ${!isReady ? "hidden" : ""}`} ref={googleButtonRef} />
                {!isReady && (
                  <button
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:from-indigo-500 hover:to-purple-500 active:scale-95 sm:w-auto sm:text-lg"
                    onClick={() => setError("Google Sign-In is blocked. Please disable your ad blocker, tracking protection, or Brave shields for this site.")}
                    type="button"
                  >
                    <span>{isSigningIn ? "Signing in..." : "Log in to start quiz"}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:from-indigo-500 hover:to-purple-500 active:scale-95 sm:w-auto sm:text-lg"
                onClick={() => setError("Google client ID is not configured.")}
                type="button"
              >
                <span>Log in to start quiz</span>
                <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            )}
            {error && <p className="max-w-sm rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
          </div>
        )}
      </section>
    </main>
  );
}

export default LandingPage;
