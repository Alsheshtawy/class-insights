export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const SKIP_HEADER = /(^|\b)(id|name)(\b|$)|اسم|رقم/i;

export function computeStats(rows) {
  if (rows.length < 2) {
    throw new Error("The file needs a header row and at least one student row.");
  }
  const [header, ...data] = rows;
  const subjects = {};

  header.forEach((rawName, col) => {
    const name = rawName.trim();
    if (!name || SKIP_HEADER.test(name)) return;

    const values = data
      .map((r) => (r[col] ?? "").trim())
      .filter((v) => v !== "");
    const nums = values.map(Number).filter((n) => !Number.isNaN(n));
    if (values.length === 0 || nums.length / values.length < 0.8) return;

    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const average = nums.reduce((s, n) => s + n, 0) / nums.length;

    subjects[name] = {
      count: nums.length,
      average: Math.round(average * 10) / 10,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      below_60: nums.filter((n) => n < 60).length,
    };
  });

  if (Object.keys(subjects).length === 0) {
    throw new Error("No numeric score columns found. Check that the first row has column names.");
  }
  return { students: data.length, subjects };
}
