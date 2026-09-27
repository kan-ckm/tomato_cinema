"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
} from "lucide-react";

interface DiagramViewerProps {
  src: string;
  title: string;
  description?: string;
  height?: string;
}

export function DiagramViewer({
  src,
  title,
  description,
  height = "520px",
}: DiagramViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={`my-8 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-4 z-50 flex flex-col bg-background/95 border-rose-500/50 shadow-2xl backdrop-blur-md"
          : "relative"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold truncate text-foreground">
                {title}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Sparkles className="h-2.5 w-2.5" />
                Archify Interactive
              </span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card/80 hover:bg-accent text-foreground hover:text-rose-500 transition-colors cursor-pointer"
            title="Mở trong tab mới để xem toàn màn hình & xuất file"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mở toàn trang</span>
          </a>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card/80 hover:bg-accent text-foreground hover:text-rose-500 transition-colors cursor-pointer"
            title={isFullscreen ? "Thu nhỏ" : "Mở rộng"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Phóng to</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Frame content */}
      <div className={`w-full relative ${isFullscreen ? "flex-1" : ""}`}>
        <iframe
          src={src}
          title={title}
          className="w-full border-0 rounded-b-2xl bg-card"
          style={{ height: isFullscreen ? "100%" : height }}
          loading="lazy"
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/40 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Hỗ trợ: Pan / Zoom, Tracing tương tác, chuyển đổi Theme Dark/Light và
          xuất SVG/PNG.
        </span>
        <span className="text-[10px] opacity-75">
          Chuẩn chất lượng Showcase
        </span>
      </div>
    </div>
  );
}
