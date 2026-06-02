const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const analyzeExpenses = async (expenses: any[]) => {
  const response = await fetch(`${API_URL}/analyze-expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expenses,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : "Failed to analyze expenses.";
    throw new Error(detail);
  }

  return data;
};

export const askFinanceQuestion = async (message: string) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : "Failed to answer your question.";
    throw new Error(detail);
  }

  return data;
};
