"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { OverviewSection } from "./components/OverviewSection";
import { MonorepoSection } from "./components/MonorepoSection";
import { DatabaseSection } from "./components/DatabaseSection";
import { WorkflowsSection } from "./components/WorkflowsSection";
import { ContractsSection } from "./components/ContractsSection";
import { DevOpsSection } from "./components/DevOpsSection";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "overview",
        "interactive-map",
        "monorepo-deps",
        "database-erd",
        "redis-cache",
        "flow-otp",
        "api-rest",
        "devops-guide",
      ];
      const scrollPos = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        if (!id) continue;
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="docs-layout">
      {/* Top Navigation Bar */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Left Sidebar Menu */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Documentation Content */}
      <main className="docs-main">
        <OverviewSection />
        <MonorepoSection />
        <DatabaseSection />
        <WorkflowsSection />
        <ContractsSection />
        <DevOpsSection />

        {/* Footer */}
        <footer
          style={{
            marginTop: "4rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            color: "#64748b",
            fontSize: "0.825rem",
          }}
        >
          <div>
            <span>
              🍅 <strong>Tomato Cinema</strong> — Hệ sinh thái Microservices
              phân tán
            </span>
          </div>
          <div>
            <span>
              Phát triển trên nền tảng Next.js 16 • React 19 • Turborepo
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
