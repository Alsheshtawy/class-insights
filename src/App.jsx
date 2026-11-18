import { useState } from "react";
import { parseCsv, computeStats } from "./lib/stats";
import { analyzeClass } from "./lib/api";
import "./App.css";

const MAX_BYTES = 1024 * 1024;

function List({ title, items }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [stats, setStats] = useState(null);
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    setStats(null);
    setResult(null);
    setAiError("");
    setFileError("");
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setFileError("File is too large (maximum 1 MB).");
      return;
    }
    try {
      const text = await file.text();
      setStats(computeStats(parseCsv(text)));
    } catch (err) {
      setFileError(err.message);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setAiError("");
    setResult(null);
    try {
      setResult(await analyzeClass(stats, language));
    } catch (err) {
      setAiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Class Insights</h1>
      <p>
        Upload a CSV of class scores (one row per student). Names and IDs are
        never sent anywhere; only summary numbers are shared with the AI.
      </p>

      <div className="controls">
        <div>
          <label htmlFor="csv">Scores file (.csv)</label>
          <input id="csv" type="file" accept=".csv,text/csv" onChange={handleFile} />
        </div>
        <div>
          <label htmlFor="lang">Summary language</label>
          <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ar">Egyptian Arabic</option>
          </select>
        </div>
      </div>

      <div aria-live="polite">
        {fileError && <p role="alert" className="error">{fileError}</p>}
      </div>

      {stats && (
        <section>
          <h2>Statistics ({stats.students} students)</h2>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Summary statistics per subject</caption>
              <thead>
                <tr>
                  <th scope="col">Subject</th>
                  <th scope="col">Average</th>
                  <th scope="col">Median</th>
                  <th scope="col">Min</th>
                  <th scope="col">Max</th>
                  <th scope="col">Below 60</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.subjects).map(([name, s]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    <td>{s.average}</td>
                    <td>{s.median}</td>
                    <td>{s.min}</td>
                    <td>{s.max}</td>
                    <td>{s.below_60}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Get AI summary"}
          </button>
        </section>
      )}

      <div aria-live="polite">
        {aiError && <p role="alert" className="error">{aiError}</p>}
        {result && (
          <div dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
            <h2>AI summary</h2>
            <p>{result.summary}</p>
            <div className="cards">
              <List title="Strengths" items={result.strengths} />
              <List title="Concerns" items={result.concerns} />
              <List title="Next steps" items={result.next_steps} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
