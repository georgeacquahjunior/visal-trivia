const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function formatApiError(error) {
  const detail = error?.detail ?? error;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        const location = Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
        return `${location ? `${location}: ` : ""}${item.msg ?? JSON.stringify(item)}`;
      })
      .join(" ");
  }

  if (detail && typeof detail === "object") {
    return detail.message ?? detail.msg ?? JSON.stringify(detail);
  }

  return "Request failed";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(formatApiError(error));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function verifyGoogleCredential(credential) {
  return request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function verifyName(name) {
  return request("/api/auth/name", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getCategories() {
  return request("/api/categories");
}

export function getQuizSettings() {
  return request("/api/quiz/settings");
}

export function startQuiz(payload) {
  return request("/api/quiz/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitQuiz(payload) {
  return request("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkAnswer(payload) {
  return request("/api/quiz/check-answer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getLeaderboard(limit = 10) {
  return request(`/api/leaderboard?limit=${limit}`);
}

function adminOptions(user, options = {}) {
  return {
    ...options,
    headers: {
      "x-google-credential": user?.credential ?? "",
      ...options.headers,
    },
  };
}

export function adminGetQuestions(user) {
  return request("/api/admin/questions", adminOptions(user));
}

export function adminCreateQuestion(user, payload) {
  return request(
    "/api/admin/questions",
    adminOptions(user, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function adminUpdateQuestion(user, questionId, payload) {
  return request(
    `/api/admin/questions/${questionId}`,
    adminOptions(user, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

export function adminDeleteQuestion(user, questionId) {
  return request(
    `/api/admin/questions/${questionId}`,
    adminOptions(user, {
      method: "DELETE",
    }),
  );
}

export async function adminImportQuestionsCsv(user, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/admin/questions/import-csv`, {
    method: "POST",
    headers: {
      "x-google-credential": user?.credential ?? "",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(formatApiError(error));
  }

  return response.json();
}

export function adminGetCategories(user) {
  return request("/api/admin/categories", adminOptions(user));
}

export function adminGetAnalytics(user) {
  return request("/api/admin/analytics", adminOptions(user));
}

export function adminGetUsers(user) {
  return request("/api/admin/users", adminOptions(user));
}

export function adminGetSettings(user) {
  return request("/api/admin/settings", adminOptions(user));
}

export function adminUpdateSettings(user, payload) {
  return request(
    "/api/admin/settings",
    adminOptions(user, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}
