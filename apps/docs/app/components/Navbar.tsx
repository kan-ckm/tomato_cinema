"use client";

import React from "react";
import { IconExternalLink, IconSearch, IconMenu, IconClose } from "./Icons";

interface NavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Navbar({
  isSidebarOpen,
  onToggleSidebar,
  searchQuery,
  setSearchQuery,
}: NavbarProps) {
  return (
    <header className="docs-navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
        </button>

        {/* Brand Logo & Title */}
        <a href="#overview" className="nav-brand">
          <span style={{ fontSize: "1.35rem" }}>🍅</span>
          <div>
            <span style={{ fontSize: "1.05rem" }}>Tomato Cinema</span>
            <small
              className="hide-on-mobile"
              style={{
                display: "block",
                fontSize: "0.68rem",
                color: "#94a3b8",
                fontWeight: 400,
              }}
            >
              Microservices & Monorepo Docs
            </small>
          </div>
        </a>
        <span className="badge badge-red hide-on-tablet">Next.js 16</span>
      </div>

      {/* Right Controls: Search & External Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            background: "#1e293b",
            borderRadius: "var(--radius-full)",
            padding: "0.3rem 0.65rem",
            border: "1px solid var(--border-color)",
            width: "clamp(120px, 20vw, 220px)",
          }}
        >
          <IconSearch size={14} className="w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#f8fafc",
              fontSize: "0.8rem",
              marginLeft: "0.4rem",
              width: "100%",
            }}
          />
        </div>

        <a
          href="/architecture-diagram.html"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item hide-on-mobile"
          style={{
            background: "rgba(6, 182, 212, 0.12)",
            color: "#22d3ee",
            borderColor: "rgba(6, 182, 212, 0.3)",
            fontSize: "0.8rem",
            padding: "0.35rem 0.65rem",
            whiteSpace: "nowrap",
          }}
        >
          <span>Sơ đồ Archify</span>
          <IconExternalLink size={12} className="w-3 h-3" />
        </a>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item hide-on-tablet"
          style={{
            fontSize: "0.8rem",
            padding: "0.35rem 0.65rem",
            whiteSpace: "nowrap",
          }}
        >
          <span>Web App (:3000)</span>
          <IconExternalLink size={12} className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
}
