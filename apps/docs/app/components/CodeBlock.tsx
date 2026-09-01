"use client";

import React, { useState } from "react";
import { IconCheck, IconCopy } from "./Icons";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  title,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <div className="code-container">
      <div className="code-header">
        <span>{title || language}</span>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            background: "none",
            border: "none",
            color: copied ? "#34d399" : "#94a3b8",
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: "0.2rem 0.4rem",
            borderRadius: "4px",
          }}
        >
          {copied ? (
            <>
              <IconCheck className="w-3.5 h-3.5" /> Đã sao chép
            </>
          ) : (
            <>
              <IconCopy className="w-3.5 h-3.5" /> Sao chép
            </>
          )}
        </button>
      </div>
      <pre className="code-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}
