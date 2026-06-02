import { ChevronRight, Layers } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn.js";

function LandingPage({ onDashboard }) {
  const { loginWithGoogleCredential, loginWithName, user } = useAuth();
  const googleButtonRef = useRef(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleNameLogin = useCallback(
    async () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Please enter your name to continue.");
        return;
      }

      setIsSigningIn(true);
      setError("");
      try {
        await loginWithName(trimmedName);
        onDashboard();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSigningIn(false);
      }
    },
    [loginWithName, name, onDashboard],
  );

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
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-8 text-slate-950 sm:px-6">
      <div className="w-full max-w-xl rounded-[40px] border border-slate-200 bg-white">
        <div className="relative overflow-hidden rounded-[40px] bg-white">
          <div className="relative z-10 px-8 py-14 text-center sm:px-12 sm:py-16">
            <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl bg-sky-500 text-white ">
              <Layers size={36} strokeWidth={1.8} />
            </div>

            <h1 className="text-5xl font-black tracking-tight text-slate-950 sm:text-5xl">
              <span className="text-slate-950">place</span>
              <span className="text-sky-500">IT</span>
              <span className="text-slate-950"> Trivia</span>
              <span className="text-slate-950">.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-md">
              Test your general knowledge, climb the leaderboard, and prove you're the sharpest in the room.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              {user ? (
                <button
                  type="button"
                  className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-sky-600"
                  onClick={onDashboard}
                >
                  Go to Dashboard
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div className="w-full max-w-xs space-y-4">
                  <div className="space-y-3">
                    <label className="block text-left text-sm  text-slate-500" htmlFor="name">
                      Enter your display name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-sky-500 px-6 py-4 text-base font-semibold text-white shadow-xl  transition hover:bg-sky-600"
                    onClick={handleNameLogin}
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? "Signing in..." : "Continue with name"}
                    <ChevronRight size={18} />
                  </button>

                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>or</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="w-full">
                    {clientId ? (
                      <div className={isReady ? "" : "hidden"} ref={googleButtonRef} />
                    ) : (
                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-3 rounded-[5px] bg-white px-6 py-4 text-base font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
                        onClick={() => setError("Google client ID is not configured.")}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true" fill="none">
                          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.4h11.8c-.2 1.9-1.5 4.8-4.4 6.7l6.7 5.2c4-3.7 6.9-9.2 6.9-15.2z" />
                          <path fill="#34A853" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.7-5.2c-1.9 1.3-4.4 2.2-7.8 2.2-6 0-11-4-12.8-9.5l-7 5.4C7.8 40.9 15.3 46 24 46z" />
                          <path fill="#FBBC05" d="M11.2 28.2C10.8 27 10.5 25.5 10.5 24s.3-3 .7-4.2l-7-5.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.2 9.6l7-5.4z" />
                          <path fill="#EA4335" d="M24 10.3c3.3 0 5.6 1.4 6.9 2.6l5.9-5.8C33.1 3.9 28.9 2 24 2 15.3 2 7.8 7.1 4.2 14.4l7 5.4C13 14.3 18 10.3 24 10.3z" />
                        </svg>
                        Continue with Google
                      </button>
                    )}

                    {isReady || clientId ? null : (
                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Google Sign-In is unavailable. Please check your configuration.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="max-w-sm rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}
            </div>

            <p className="mt-10 text-sm text-slate-500">Secured by Visal Re · placeIT</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LandingPage;
