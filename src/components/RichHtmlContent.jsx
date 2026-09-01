import { C } from "../lib/theme";
import { htmlToPlain, looksLikeHtml, plainToHtml } from "../lib/richText";

function renderPlainMentions(text, users) {
  const parts = text.split(/(@[\w.+-]+(?:\s[\w.+-]+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const mention = part.slice(1);
      const match = users.find((u) =>
        u.name.toLowerCase() === mention.toLowerCase() ||
        u.name.toLowerCase().startsWith(mention.toLowerCase()) ||
        u.email.split("@")[0].toLowerCase() === mention.toLowerCase()
      );
      return (
        <span
          key={i}
          style={{
            color: C.primary,
            fontWeight: 700,
            background: C.primarySoft,
            borderRadius: 3,
            padding: "0 3px",
          }}
        >
          @{match ? match.name : mention}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function RichHtmlContent({ html, users, className = "issue-rich-html" }) {
  const raw = html || "";

  if (!looksLikeHtml(raw)) {
    return (
      <div className={className} style={{ fontSize: 13, color: C.text, lineHeight: 1.45 }}>
        {users ? renderPlainMentions(raw, users) : raw}
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

export function previewPlainFromHtml(html, max = 80) {
  const plain = htmlToPlain(html).trim();
  if (!plain) return "";
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}
