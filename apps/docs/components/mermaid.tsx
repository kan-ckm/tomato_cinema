"use client";

import React, { useEffect, useId, useState } from "react";

interface MermaidProps {
  chart: string;
  caption?: string;
}

export function Mermaid({ chart, caption }: MermaidProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `mermaid_${rawId}`;
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark =
          document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark";

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDark ? "dark" : "neutral",
          fontFamily: "inherit",
          themeVariables: isDark
            ? {
                primaryColor: "#3b82f6",
                primaryTextColor: "#f8fafc",
                primaryBorderColor: "#60a5fa",
                lineColor: "#94a3b8",
                secondaryColor: "#1e293b",
                tertiaryColor: "#0f172a",
              }
            : {
                primaryColor: "#2563eb",
                primaryTextColor: "#0f172a",
                primaryBorderColor: "#3b82f6",
                lineColor: "#64748b",
                secondaryColor: "#f1f5f9",
                tertiaryColor: "#ffffff",
              },
        });

        // Clean any old container if it exists
        const oldElem = document.getElementById(id);
        if (oldElem) oldElem.remove();

        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Lỗi render sơ đồ Mermaid",
          );
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="my-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
        <p className="font-semibold mb-1">
          Không thể hiển thị biểu đồ Mermaid:
        </p>
        <pre className="text-xs overflow-x-auto">{error}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 p-8 border rounded-xl bg-muted/30 animate-pulse flex flex-col items-center justify-center gap-2">
        <div className="h-4 w-32 bg-muted rounded"></div>
        <p className="text-xs text-muted-foreground">
          Đang vẽ biểu đồ kiến trúc...
        </p>
      </div>
    );
  }

  return (
    <figure className="my-6">
      <div
        className="overflow-x-auto p-4 md:p-6 bg-card rounded-xl border border-border shadow-sm flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
