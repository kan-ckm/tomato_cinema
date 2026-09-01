"use client";

import React, { useState } from "react";
import { CodeBlock } from "./CodeBlock";

export function DevOpsSection() {
  const [activeDevOpsTab, setActiveDevOpsTab] = useState<
    "quickstart" | "docker" | "env" | "observability"
  >("quickstart");

  return (
    <section id="devops-guide" style={{ marginBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge-emerald">DevOps & Hướng dẫn Cài đặt</span>
        <span className="badge badge-blue">Docker Compose</span>
        <span className="badge badge-purple">Turborepo Pipelines</span>
      </div>
      <h1 className="doc-title">
        Hướng dẫn Cài đặt & Khởi chạy Toàn bộ Hệ sinh thái
      </h1>
      <p className="doc-lead">
        Dự án được tối ưu hóa để có thể khởi động nhanh chóng trên môi trường
        phát triển cục bộ (Local Development) chỉ với một vài câu lệnh nhờ
        Docker Compose và Turborepo.
      </p>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeDevOpsTab === "quickstart" ? "active" : ""}`}
          onClick={() => setActiveDevOpsTab("quickstart")}
        >
          🚀 Hướng dẫn Khởi động từ A - Z (Quickstart)
        </button>
        <button
          className={`tab-btn ${activeDevOpsTab === "docker" ? "active" : ""}`}
          onClick={() => setActiveDevOpsTab("docker")}
        >
          🐳 Cấu trúc Docker Compose Multi-Stack
        </button>
        <button
          className={`tab-btn ${activeDevOpsTab === "env" ? "active" : ""}`}
          onClick={() => setActiveDevOpsTab("env")}
        >
          🔑 Ma trận Biến môi trường (.env)
        </button>
        <button
          className={`tab-btn ${activeDevOpsTab === "observability" ? "active" : ""}`}
          onClick={() => setActiveDevOpsTab("observability")}
        >
          📊 Trực quan hóa & Observability Stack
        </button>
      </div>

      {/* Tab 1: Quickstart */}
      {activeDevOpsTab === "quickstart" && (
        <div>
          <div className="doc-card" style={{ borderLeft: "4px solid #ef4444" }}>
            <h3 style={{ color: "#f87171", fontSize: "1.05rem" }}>
              📌 Yêu cầu Tiên quyết (Prerequisites)
            </h3>
            <ul
              style={{
                paddingLeft: "1.25rem",
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "#cbd5e1",
                lineHeight: 1.6,
              }}
            >
              <li>
                <strong>Node.js:</strong> Phiên bản <code>&gt;= 18.0.0</code>{" "}
                (Khuyên dùng Node 20 LTS).
              </li>
              <li>
                <strong>pnpm:</strong> Phiên bản <code>&gt;= 9.0.0</code> (Cài
                đặt: <code>npm i -g pnpm</code>).
              </li>
              <li>
                <strong>Docker & Docker Compose:</strong> Dùng để chạy cụm CSDL
                Postgres, Redis và RabbitMQ.
              </li>
            </ul>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {/* Step 1 */}
            <div className="doc-card">
              <span
                className="badge badge-red"
                style={{ marginBottom: "0.35rem" }}
              >
                Bước 1
              </span>
              <h3 style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                Cài đặt tất cả Dependencies cho Monorepo
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  margin: "0.3rem 0",
                }}
              >
                pnpm sẽ tự động liên kết các package nội bộ (
                <code>@tomatocinema/*</code>, <code>@repo/*</code>) bằng symlink
                cực nhanh mà không cần publish lên npm.
              </p>
              <CodeBlock
                language="bash"
                title="Terminal (Thư mục gốc dự án)"
                code="pnpm install"
              />
            </div>

            {/* Step 2 */}
            <div className="doc-card">
              <span
                className="badge badge-red"
                style={{ marginBottom: "0.35rem" }}
              >
                Bước 2
              </span>
              <h3 style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                Khởi động Cụm Hạ tầng Docker (Postgres, Redis, RabbitMQ)
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  margin: "0.3rem 0",
                }}
              >
                Khởi động cơ sở dữ liệu PostgreSQL (port 5433), Redis (port
                6379) và RabbitMQ (AMQP port 5673 + UI port 15673).
              </p>
              <CodeBlock
                language="bash"
                title="Terminal"
                code={`# Bật hạ tầng chạy ngầm trong thư mục docker/infra
cd docker/infra && docker compose up -d

# Hoặc bật từ thư mục docker gốc:
cd docker && docker compose up -d`}
              />
            </div>

            {/* Step 3 */}
            <div className="doc-card">
              <span
                className="badge badge-red"
                style={{ marginBottom: "0.35rem" }}
              >
                Bước 3
              </span>
              <h3 style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                Biên dịch Hợp đồng gRPC Protobuf (.proto)
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  margin: "0.3rem 0",
                }}
              >
                Biên dịch các file <code>auth.proto</code>,{" "}
                <code>account.proto</code>, <code>users.proto</code> sang mã
                TypeScript để các service có thể import types.
              </p>
              <CodeBlock
                language="bash"
                title="Terminal"
                code="pnpm --filter @tomatocinema/contracts build"
              />
            </div>

            {/* Step 4 */}
            <div className="doc-card">
              <span
                className="badge badge-red"
                style={{ marginBottom: "0.35rem" }}
              >
                Bước 4
              </span>
              <h3 style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                Đồng bộ CSDL Auth Service (Prisma DB Push)
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  margin: "0.3rem 0",
                }}
              >
                Đẩy schema Prisma vào database PostgreSQL <code>auth</code> để
                tạo bảng <code>accounts</code> và{" "}
                <code>pending_contact_changes</code>.
              </p>
              <CodeBlock
                language="bash"
                title="Terminal"
                code="pnpm --filter auth-service exec prisma db push"
              />
            </div>

            {/* Step 5 */}
            <div className="doc-card">
              <span
                className="badge badge-red"
                style={{ marginBottom: "0.35rem" }}
              >
                Bước 5
              </span>
              <h3 style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                Khởi chạy Toàn bộ Microservices với Turborepo
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  margin: "0.3rem 0",
                }}
              >
                Chỉ một lệnh duy nhất tại thư mục gốc để khởi động đồng thời
                Gateway, Auth, Users, Notification, Bot và Web Docs:
              </p>
              <CodeBlock language="bash" title="Terminal" code="pnpm dev" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Docker Compose Multi-Stack */}
      {activeDevOpsTab === "docker" && (
        <div>
          <div className="doc-card">
            <h3 style={{ color: "#38bdf8", fontSize: "1.05rem" }}>
              🐳 Kiến trúc Docker Compose Phân tầng
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                margin: "0.4rem 0",
              }}
            >
              Dự án sử dụng tính năng <code>include</code> hiện đại của Docker
              Compose để phân tách cấu hình thành 3 tầng độc lập:
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "0.825rem",
                color: "#cbd5e1",
                lineHeight: 1.6,
              }}
            >
              <li>
                <code>docker/infra/docker-compose.yml</code>: Postgres, Redis,
                RabbitMQ và các Exporter đo đạc Prometheus.
              </li>
              <li>
                <code>docker/apps/docker-compose.yml</code>: Gateway, Auth
                Service, User Service, Notification Service, Bot Service.
              </li>
              <li>
                <code>docker/observability/docker-compose.yml</code>: OTel
                Collector, Tempo, Loki, Prometheus, Grafana.
              </li>
            </ul>
          </div>

          <CodeBlock
            language="yaml"
            title="docker/docker-compose.yml"
            code={`# Tổng hợp toàn bộ hệ thống Tomato Cinema bằng tính năng include
name: tomato-cinema

include:
  - path: ./infra/docker-compose.yml
    env_file: ./infra/.env
  - path: ./apps/docker-compose.yml
    env_file: ./apps/.env
  - path: ./observability/docker-compose.yml
    env_file: ./observability/.env`}
          />
        </div>
      )}

      {/* Tab 3: Environment Variables */}
      {activeDevOpsTab === "env" && (
        <div className="doc-card">
          <h3
            style={{
              color: "#fbbf24",
              fontSize: "1.05rem",
              marginBottom: "0.6rem",
            }}
          >
            🔑 Ma trận Biến Môi trường Cốt lõi (Environment Variables)
          </h3>
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Biến Môi trường (Variable)</th>
                  <th>Dịch vụ sử dụng</th>
                  <th>Giá trị mẫu / Mặc định</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>DATABASE_URL</code>
                  </td>
                  <td>
                    <code>auth-service</code>
                  </td>
                  <td>
                    <code>postgresql://tomato:pass@localhost:5433/auth</code>
                  </td>
                  <td>Chuỗi kết nối PostgreSQL cho Prisma ORM</td>
                </tr>
                <tr>
                  <td>
                    <code>RMQ_URL</code>
                  </td>
                  <td>
                    <code>auth-service</code>, <code>notification-service</code>
                  </td>
                  <td>
                    <code>amqp://guest:guest@localhost:5673</code>
                  </td>
                  <td>Chuỗi kết nối RabbitMQ Message Broker</td>
                </tr>
                <tr>
                  <td>
                    <code>AUTH_GRPC_URL</code>
                  </td>
                  <td>
                    <code>gateway-service</code>, <code>bot-service</code>
                  </td>
                  <td>
                    <code>localhost:50051</code>
                  </td>
                  <td>Địa chỉ gRPC Endpoint của Auth Service</td>
                </tr>
                <tr>
                  <td>
                    <code>USERS_GRPC_URL</code>
                  </td>
                  <td>
                    <code>gateway-service</code>, <code>auth-service</code>
                  </td>
                  <td>
                    <code>localhost:50052</code>
                  </td>
                  <td>Địa chỉ gRPC Endpoint của User Service</td>
                </tr>
                <tr>
                  <td>
                    <code>PASSPORT_SECRET_KEY</code>
                  </td>
                  <td>
                    <code>gateway-service</code>, <code>auth-service</code>
                  </td>
                  <td>
                    <code>secret_key_very_strong_123456</code>
                  </td>
                  <td>Khóa ký và giải mã JWT Access/Refresh Token</td>
                </tr>
                <tr>
                  <td>
                    <code>TELEGRAM_BOT_TOKEN</code>
                  </td>
                  <td>
                    <code>auth-service</code>, <code>bot-service</code>
                  </td>
                  <td>
                    <code>123456789:ABCdefGhI...</code>
                  </td>
                  <td>Token Bot Telegram do BotFather cấp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Observability */}
      {activeDevOpsTab === "observability" && (
        <div>
          <div className="card-grid">
            <div
              className="doc-card"
              style={{ borderLeft: "4px solid #f59e0b" }}
            >
              <h3 style={{ color: "#fbbf24", fontSize: "1.05rem" }}>
                📈 Grafana Dashboard
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  marginTop: "0.25rem",
                }}
              >
                Địa chỉ: <code>http://localhost:3001</code> (User/Pass:{" "}
                <code>admin / admin</code>)
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#cbd5e1",
                  marginTop: "0.4rem",
                }}
              >
                Xem biểu đồ CPU, RAM, gRPC request rate và trực quan hóa trace
                call xuyên suốt các microservices.
              </p>
            </div>

            <div
              className="doc-card"
              style={{ borderLeft: "4px solid #ef4444" }}
            >
              <h3 style={{ color: "#f87171", fontSize: "1.05rem" }}>
                🐇 RabbitMQ Management
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  marginTop: "0.25rem",
                }}
              >
                Địa chỉ: <code>http://localhost:15673</code> (User/Pass:{" "}
                <code>guest / guest</code>)
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#cbd5e1",
                  marginTop: "0.4rem",
                }}
              >
                Theo dõi số lượng tin nhắn trong hàng đợi{" "}
                <code>notifications_queue</code> và tốc độ consume sự kiện gửi
                mail/SMS OTP.
              </p>
            </div>

            <div
              className="doc-card"
              style={{ borderLeft: "4px solid #3b82f6" }}
            >
              <h3 style={{ color: "#60a5fa", fontSize: "1.05rem" }}>
                📑 Gateway Swagger Docs
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  marginTop: "0.25rem",
                }}
              >
                Địa chỉ: <code>http://localhost:3500/docs</code>
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#cbd5e1",
                  marginTop: "0.4rem",
                }}
              >
                Tài liệu OpenAPI/Swagger tương tác trực tiếp, test gửi OTP và
                thực thi các endpoint REST API.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
