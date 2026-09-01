"use client";

import React from "react";
import {
  IconArchitecture,
  IconPackage,
  IconDatabase,
  IconWorkflow,
  IconApi,
  IconTerminal,
  IconBook,
  IconClose,
} from "./Icons";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  activeSection,
  setActiveSection,
}: SidebarProps) {
  const menuItems = [
    {
      group: "1. Bức tranh Tổng quan",
      items: [
        {
          id: "overview",
          label: "Kiến trúc Microservices",
          icon: IconArchitecture,
          badge: "Core",
        },
        {
          id: "interactive-map",
          label: "Bản đồ Tương tác",
          icon: IconBook,
          badge: "Live",
        },
      ],
    },
    {
      group: "2. Cấu trúc Monorepo",
      items: [
        {
          id: "monorepo-deps",
          label: "Mô hình Kết nối Packages",
          icon: IconPackage,
          badge: "pnpm",
        },
      ],
    },
    {
      group: "3. Cơ sở Dữ liệu & Storage",
      items: [
        {
          id: "database-erd",
          label: "Sơ đồ ERD & Bảng CSDL",
          icon: IconDatabase,
          badge: "Postgres",
        },
        {
          id: "redis-cache",
          label: "Cấu trúc Redis Cache",
          icon: IconDatabase,
          badge: "Redis",
        },
      ],
    },
    {
      group: "4. Luồng Nghiệp vụ & Sequence",
      items: [
        {
          id: "flow-otp",
          label: "Xác thực Passwordless OTP",
          icon: IconWorkflow,
          badge: "Flow",
        },
      ],
    },
    {
      group: "5. Hợp đồng & Tham chiếu API",
      items: [
        {
          id: "api-rest",
          label: "REST & gRPC Contracts",
          icon: IconApi,
          badge: "API",
        },
      ],
    },
    {
      group: "6. Hướng dẫn & DevOps",
      items: [
        {
          id: "devops-guide",
          label: "Cài đặt & Khởi chạy Docker",
          icon: IconTerminal,
          badge: "Setup",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`docs-sidebar ${isOpen ? "open" : ""}`}>
        {/* Mobile Header Inside Sidebar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "0.75rem",
            marginBottom: "0.5rem",
            borderBottom: "1px solid var(--border-color)",
          }}
          className="mobile-menu-btn"
        >
          <span
            style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f87171" }}
          >
            🍅 Mục lục Tài liệu
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {menuItems.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="nav-group-title">{group.group}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                    onClose(); // Auto close sidebar on mobile
                    const el = document.getElementById(item.id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={16} className="w-4 h-4" />
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`badge ${
                        item.badge === "Core"
                          ? "badge-red"
                          : item.badge === "Live"
                            ? "badge-cyan"
                            : item.badge === "Postgres"
                              ? "badge-blue"
                              : item.badge === "Redis"
                                ? "badge-purple"
                                : item.badge === "Setup"
                                  ? "badge-amber"
                                  : "badge-emerald"
                      }`}
                      style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}

        <div
          style={{
            marginTop: "1.75rem",
            padding: "0.85rem",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "#fca5a5", fontWeight: 600 }}>
            🍅 Tomato Cinema
          </p>
          <p
            style={{
              fontSize: "0.7rem",
              color: "#94a3b8",
              marginTop: "0.2rem",
              lineHeight: 1.4,
            }}
          >
            Microservices Monorepo Docs
          </p>
        </div>
      </aside>
    </>
  );
}
