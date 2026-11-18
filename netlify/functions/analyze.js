const SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    concerns: { type: "ARRAY", items: { type: "STRING" } },
    next_steps: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "strengths", "concerns", "next_steps"],
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  let input;
  try {
    input = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  const { stats, language } = input;
  if (!stats || typeof stats !== "object") {
    return json({ error: "Missing class statistics" }, 400);
  }

  const system =
    "You help teachers read class results. You only see aggregate statistics, " +
    "never student names. Be specific, practical and short. " +
    "Do not invent numbers that are not in the data. " +
    `Write in ${language === "ar" ? "Egyptian Arabic" : "English"}.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [
            { parts: [{ text: `Class statistics:\n${JSON.stringify(stats)}` }] },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SCHEMA,
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) { const detail = await res.text(); console.error("Gemini status:", res.status, detail); return json({ error: "AI service error" }, 502); }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    if (!parsed.summary || !Array.isArray(parsed.next_steps)) {
      return json({ error: "Unexpected AI response" }, 502);
    }
    return json(parsed);
  } catch {
    return json({ error: "AI request failed or timed out" }, 502);
  }
};




