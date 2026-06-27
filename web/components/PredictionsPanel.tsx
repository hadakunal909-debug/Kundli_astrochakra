import React from "react";

// Minimal renderer for the markdown subset emitted by generateHoroscope
// (##/###/#### headings, "- " bullets, **bold** inline). Builds React nodes
// directly — no dangerouslySetInnerHTML, so it's XSS-safe by construction.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>;
  });
}

export default function PredictionsPanel({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const out: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      const items = listItems;
      out.push(
        <ul key={`ul-${key++}`}>
          {items.map((li, i) => (
            <li key={i}>{renderInline(li, `li-${key}-${i}`)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("#### ")) {
      flushList();
      out.push(<h4 key={key++}>{renderInline(line.slice(5), `h4-${key}`)}</h4>);
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(<h3 key={key++}>{renderInline(line.slice(4), `h3-${key}`)}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(<h2 key={key++}>{renderInline(line.slice(3), `h2-${key}`)}</h2>);
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(<p key={key++}>{renderInline(line, `p-${key}`)}</p>);
    }
  }
  flushList();

  return <div className="predictions">{out}</div>;
}
