import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";

import App from "./App.jsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of standard sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
