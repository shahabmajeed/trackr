/** Shared Quill toolbar presets */
export const RICH_TEXT_MODULES_FULL = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export const RICH_TEXT_MODULES_COMPACT = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export function looksLikeHtml(value) {
  if (!value || typeof value !== "string") return false;
  return /<[a-z][\s\S]*>/i.test(value);
}

export function htmlToPlain(html) {
  if (!html) return "";
  if (!looksLikeHtml(html)) return html;
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").replace(/\u00a0/g, " ");
  }
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function isEmptyHtml(html) {
  return !htmlToPlain(html).trim();
}

export function plainToHtml(text) {
  if (!text) return "";
  if (looksLikeHtml(text)) return text;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}
