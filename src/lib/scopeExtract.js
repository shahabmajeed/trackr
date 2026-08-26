/**
 * Extract plain text from PDF / DOCX / plain text files,
 * then heuristically map into Scope fields.
 */

async function extractPdfText(file) {
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return parts.join("\n");
}

async function extractDocxText(file) {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value || "";
}

async function extractPlainText(file) {
  return file.text();
}

export async function extractTextFromFile(file) {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";
  if (type === "application/pdf" || name.endsWith(".pdf")) return extractPdfText(file);
  if (
    type.includes("wordprocessingml") ||
    name.endsWith(".docx")
  ) return extractDocxText(file);
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return extractPlainText(file);
  }
  throw new Error("Supported for auto-fill: PDF, DOCX, or TXT files.");
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function detectPlatform(text) {
  const t = text.toLowerCase();
  if (/\bshopify\b/.test(t)) return "shopify";
  if (/\bwordpress\b|\bwp\b/.test(t)) return "wordpress";
  if (/\bwoocommerce\b/.test(t)) return "woocommerce";
  if (/\bwebflow\b/.test(t)) return "webflow";
  if (/\bwix\b/.test(t)) return "wix";
  if (/\bcustom\b|\breact\b|\bnext\.?js\b/.test(t)) return "custom";
  return "";
}

function detectSource(text) {
  const t = text.toLowerCase();
  if (/\bupwork\b/.test(t)) return "upwork";
  if (/\bfiverr\b/.test(t)) return "fiverr";
  if (/\blinkedin\b/.test(t)) return "linkedin";
  if (/\breferral\b|\breferred\b/.test(t)) return "referral";
  if (/\bemail\b/.test(t)) return "email";
  return "";
}

function textToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const safe = p
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      return `<p>${safe}</p>`;
    })
    .join("");
}

/** Parse extracted text into Scope field suggestions. */
export function parseScopeFromText(raw) {
  const text = (raw || "").replace(/\r/g, "").trim();
  if (!text) return {};

  const email = firstMatch(text, [
    /(?:client\s*email|email)\s*[:\-]\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i,
  ]);

  const website = firstMatch(text, [
    /(?:website|site|url|web)\s*[:\-]\s*((?:https?:\/\/)?[^\s<>"']+)/i,
    /\b(https?:\/\/[^\s<>"']+)/i,
  ]);

  const clientName = firstMatch(text, [
    /(?:client\s*name|client)\s*[:\-]\s*([^\n,]{2,80})/i,
    /(?:from|for)\s*[:\-]\s*([A-Z][A-Za-z .'-]{1,60})/,
  ]);

  const title = firstMatch(text, [
    /(?:project\s*title|project\s*name|title)\s*[:\-]\s*([^\n]{2,120})/i,
  ]);

  let cleanWebsite = website;
  if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
    cleanWebsite = `https://${cleanWebsite}`;
  }
  // strip trailing punctuation
  if (cleanWebsite) cleanWebsite = cleanWebsite.replace(/[),.;]+$/, "");

  return {
    name: title || "",
    descriptionHtml: textToHtml(text.slice(0, 12000)),
    websiteUrl: cleanWebsite || "",
    platform: detectPlatform(text),
    clientName: clientName || "",
    clientEmail: email || "",
    clientSource: detectSource(text),
    clientWebsite: cleanWebsite || "",
    extractedPreview: text.slice(0, 500),
  };
}

export async function extractScopeFromFile(file) {
  const text = await extractTextFromFile(file);
  return parseScopeFromText(text);
}
