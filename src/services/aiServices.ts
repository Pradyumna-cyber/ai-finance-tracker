export const analyzeExpenses = async (expenses: any[]) => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/analyze-expenses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expenses,
        }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};