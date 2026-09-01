"use client";

import React from "react";
import { IconArchitecture, IconExternalLink } from "./Icons";

export function OverviewSection() {
  return (
    <section id="overview" style={{ marginBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge-red">Kiến trúc Hệ thống</span>
        <span className="badge badge-blue">Microservices + gRPC</span>
        <span className="badge badge-purple">Event-Driven</span>
      </div>
      <h1 className="doc-title">Tổng quan Hệ thống Tomato Cinema</h1>
      <p className="doc-lead">
        Tomato Cinema là nền tảng streaming phim trực tuyến được thiết kế theo
        kiến trúc <strong>Microservices phân tán</strong>, kết hợp giao tiếp
        liên dịch vụ tốc độ cao qua{" "}
        <strong>gRPC (HTTP/2 + Protocol Buffers)</strong>, xử lý sự kiện bất
        đồng bộ qua <strong>RabbitMQ</strong>, và quản lý toàn bộ mã nguồn trong
        mô hình <strong>Turborepo Monorepo</strong>.
      </p>

      {/* Embedded Archify Visualizer */}
      <div
        id="interactive-map"
        style={{ marginTop: "2rem", marginBottom: "2.5rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <h2
            className="section-heading"
            style={{ margin: 0, border: "none", padding: 0 }}
          >
            <IconArchitecture size={22} className="w-5 h-5" /> Sơ đồ Kiến trúc
            Tương tác
          </h2>
          <a
            href="/architecture-diagram.html"
            target="_blank"
            rel="noopener noreferrer"
            className="badge badge-cyan"
            style={{
              textDecoration: "none",
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
            }}
          >
            Mở toàn màn hình <IconExternalLink size={12} className="w-3 h-3" />
          </a>
        </div>
        <div className="diagram-frame">
          <iframe
            src="/architecture-diagram.html"
            title="Tomato Cinema System Architecture"
          />
        </div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            marginTop: "0.5rem",
            textAlign: "center",
          }}
        >
          💡{" "}
          <em>
            Mẹo: Bạn có thể click chuột để kéo (Pan), cuộn chuột để phóng to/thu
            nhỏ (Zoom), chọn từng View phân tầng và xuất ảnh PNG/SVG ngay trong
            khung trên.
          </em>
        </p>
      </div>

      {/* System Tiers Breakdown */}
      <h2 className="section-heading">
        Phân tầng Kiến trúc (Architectural Tiers)
      </h2>
      <div className="card-grid">
        <div className="doc-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#f87171", fontSize: "1.05rem" }}>
              1. Client & Docs Tier
            </h3>
            <span className="badge badge-red">Next.js 16</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Giao diện người dùng xem phim và cổng tài liệu nội bộ, phát triển
            trên nền tảng React 19 và Next.js App Router:
          </p>
          <ul
            style={{
              paddingLeft: "1.25rem",
              marginTop: "0.5rem",
              fontSize: "0.825rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            <li>
              <code>apps/web</code>: Web Client xem phim (port{" "}
              <code>:3000</code>).
            </li>
            <li>
              <code>apps/docs</code>: Cổng tài liệu kỹ thuật (port{" "}
              <code>:3501</code>).
            </li>
            <li>
              Import UI component chia sẻ từ <code>@repo/ui</code>.
            </li>
          </ul>
        </div>

        <div className="doc-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#fbbf24", fontSize: "1.05rem" }}>
              2. API Gateway Tier
            </h3>
            <span className="badge badge-amber">NestJS REST</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Cổng đón tiếp duy nhất từ Internet vào hạ tầng nội bộ:
          </p>
          <ul
            style={{
              paddingLeft: "1.25rem",
              marginTop: "0.5rem",
              fontSize: "0.825rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            <li>Định tuyến HTTP/REST, tài liệu hóa với Swagger/OpenAPI.</li>
            <li>Quản lý bảo mật HttpOnly Cookie cho Refresh Token Rotation.</li>
            <li>Chuyển đổi DTO REST sang gRPC Unary RPC calls đến backend.</li>
          </ul>
        </div>

        <div className="doc-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#60a5fa", fontSize: "1.05rem" }}>
              3. Microservices Tier
            </h3>
            <span className="badge badge-blue">gRPC • HTTP/2</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Các service nghiệp vụ độc lập giao tiếp nội bộ qua Protocol Buffers:
          </p>
          <ul
            style={{
              paddingLeft: "1.25rem",
              marginTop: "0.5rem",
              fontSize: "0.825rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            <li>
              <code>auth-service</code> (<code>:50051</code>): Quản lý OTP, JWT
              và Telegram SSO.
            </li>
            <li>
              <code>user-service</code> (<code>:50052</code>): Quản lý hồ sơ và
              avatar người dùng.
            </li>
            <li>
              <code>bot-service</code>: Telegram Bot hỗ trợ xác thực số điện
              thoại.
            </li>
          </ul>
        </div>

        <div className="doc-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              alignItems: "center",
            }}
          >
            <h3 style={{ color: "#34d399", fontSize: "1.05rem" }}>
              4. Async & Storage Tier
            </h3>
            <span className="badge badge-emerald">Postgres • Redis • RMQ</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Hạ tầng dữ liệu và hàng đợi sự kiện bất đồng bộ:
          </p>
          <ul
            style={{
              paddingLeft: "1.25rem",
              marginTop: "0.5rem",
              fontSize: "0.825rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            <li>
              <code>PostgreSQL</code>: CSDL quan hệ lưu Account (Prisma) và
              Users (TypeORM).
            </li>
            <li>
              <code>Redis</code>: Cache OTP hash, Telegram sessions và Token
              blacklist.
            </li>
            <li>
              <code>RabbitMQ + notification-service</code>: Gửi email/SMS OTP
              bất đồng bộ.
            </li>
          </ul>
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <h2 className="section-heading">
        Bảng Ma trận Công nghệ & Cổng Dịch vụ (Ports Matrix)
      </h2>
      <div className="doc-card">
        <div className="table-responsive">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Dịch vụ (Service)</th>
                <th>Loại (Type)</th>
                <th>Cổng (Port)</th>
                <th>Giao thức (Protocol)</th>
                <th>Công nghệ cốt lõi</th>
                <th>Trách nhiệm chính</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>apps/gateway-service</strong>
                </td>
                <td>
                  <span className="badge badge-amber">Gateway</span>
                </td>
                <td>
                  <code>:3500</code>
                </td>
                <td>HTTP/1.1 REST</td>
                <td>NestJS, Express, Swagger</td>
                <td>Đón Client, xác thực Cookie, gọi gRPC</td>
              </tr>
              <tr>
                <td>
                  <strong>apps/auth-service</strong>
                </td>
                <td>
                  <span className="badge badge-blue">Microservice</span>
                </td>
                <td>
                  <code>:50051</code>
                </td>
                <td>gRPC (HTTP/2)</td>
                <td>NestJS, Prisma, PostgreSQL, Redis</td>
                <td>Quản lý tài khoản, mã OTP, Telegram Auth</td>
              </tr>
              <tr>
                <td>
                  <strong>apps/user-service</strong>
                </td>
                <td>
                  <span className="badge badge-blue">Microservice</span>
                </td>
                <td>
                  <code>:50052</code>
                </td>
                <td>gRPC (HTTP/2)</td>
                <td>NestJS, TypeORM, PostgreSQL</td>
                <td>Quản lý profile, thông tin người dùng</td>
              </tr>
              <tr>
                <td>
                  <strong>apps/notification-service</strong>
                </td>
                <td>
                  <span className="badge badge-purple">Worker</span>
                </td>
                <td>-</td>
                <td>AMQP (RabbitMQ)</td>
                <td>NestJS, Nodemailer, Handlebars, SMS</td>
                <td>Gửi email OTP, thông báo đổi sđt/email</td>
              </tr>
              <tr>
                <td>
                  <strong>apps/bot-service</strong>
                </td>
                <td>
                  <span className="badge badge-cyan">Bot Client</span>
                </td>
                <td>-</td>
                <td>Telegram Bot API</td>
                <td>Telegraf, NestJS, gRPC Client</td>
                <td>Tương tác Telegram bot xác nhận số điện thoại</td>
              </tr>
              <tr>
                <td>
                  <strong>apps/web</strong>
                </td>
                <td>
                  <span className="badge badge-red">Web Client</span>
                </td>
                <td>
                  <code>:3000</code>
                </td>
                <td>HTTP / Web</td>
                <td>Next.js 16, React 19</td>
                <td>Giao diện xem phim người dùng</td>
              </tr>
              <tr>
                <td>
                  <strong>apps/docs</strong>
                </td>
                <td>
                  <span className="badge badge-red">Documentation</span>
                </td>
                <td>
                  <code>:3501</code>
                </td>
                <td>HTTP / Web</td>
                <td>Next.js 16, React 19</td>
                <td>Cổng tra cứu tài liệu kỹ thuật & kiến trúc</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
