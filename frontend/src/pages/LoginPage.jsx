import { Brain } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn.js";

function LoginPage({ onBack, onSuccess }) {
  const { loginWithGoogleCredential } = useAuth();
  const buttonRef = useRef(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const handleCredential = useCallback(
    async (credential) => {
      setIsSigningIn(true);
      setError("");
      try {
        await loginWithGoogleCredential(credential);
        onSuccess();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSigningIn(false);
      }
    },
    [loginWithGoogleCredential, onSuccess],
  );

  const handleError = useCallback((message) => {
    setError(message);
  }, []);

  const { clientId, isReady } = useGoogleSignIn({
    buttonRef,
    onCredential: handleCredential,
    onError: handleError,
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f7] px-4 py-10 font-sans text-[#1d1d1f]">
      <Card className="relative z-10 w-full max-w-md border-0 bg-white/70 p-8 shadow-xl shadow-black/5 backdrop-blur-xl sm:rounded-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-md">
            <Brain size={32} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ready to play?</h1>
          <p className="mt-3 text-base font-medium text-[#86868b]">
            Continue with Google to unlock the quiz and submit your score to the leaderboard.
          </p>
        </div>

        <div className="space-y-4">
          <div className={`flex min-h-12 justify-center ${!isReady ? "hidden" : ""}`} ref={buttonRef} />

          {!isReady && clientId && (
            <Button 
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500" 
              onClick={() => setError("Google Sign-In is blocked. Please disable your ad blocker, tracking protection, or Brave shields.")} 
              type="button"
            >
              Log in to start quiz
            </Button>
          )}

          {isSigningIn && <p className="text-center text-sm font-medium text-slate-500">Signing you in...</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}

          {!clientId && <p className="text-center text-sm font-medium text-slate-500">Add your Google web client ID to enable login.</p>}
          <Button className="w-full" onClick={onBack} type="button" variant="ghost">
            Back to landing
          </Button>
        </div>
      </Card>
    </main>
  );
}

export default LoginPage;
