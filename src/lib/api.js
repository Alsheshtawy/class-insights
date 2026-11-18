export async function analyzeClass(stats, language) {
  let res;
  try {
    res = await fetch("/.netlify/functions/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, language }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    throw new Error("The AI summary is unavailable right now. Your statistics are still shown above; try again in a minute.");
  }
  return res.json();
}
