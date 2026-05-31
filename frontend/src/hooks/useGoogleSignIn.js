import { useEffect, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export function useGoogleSignIn({ buttonRef, onCredential, onError }) {
  const [isReady, setIsReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      onError?.("Google client ID is not configured.");
      return undefined;
    }

    let isMounted = true;
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    function initialize() {
      if (!isMounted || !window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onCredential(response.credential);
          } else {
            onError?.("Google did not return a credential.");
          }
        },
      });

      if (buttonRef.current) {
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: Math.min(buttonRef.current.offsetWidth || 360, 400),
        });
      }

      setIsReady(true);
    }

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initialize();
      } else {
        existingScript.addEventListener("load", initialize, { once: true });
      }
      return () => {
        isMounted = false;
        existingScript.removeEventListener("load", initialize);
      };
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    script.onerror = () => onError?.("Could not load Google Sign-In.");
    document.head.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, [buttonRef, clientId, onCredential, onError]);

  return { clientId, isReady };
}
