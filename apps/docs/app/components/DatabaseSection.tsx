"use client";

import React, { useState } from "react";
import { IconDatabase, IconExternalLink } from "./Icons";
import { CodeBlock } from "./CodeBlock";

export function DatabaseSection() {
  const [selectedDbTab, setSelectedDbTab] = useState<
    "auth" | "users" | "redis" | "prisma-raw" | "typeorm-raw"
  >("auth");

  return (
    <section id="database-erd" style={{ marginBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge-blue">Cơ sở Dữ liệu & Storage</span>
        <span className="badge badge-emerald">
          PostgreSQL 16 Multi-Database
        </span>
        <span className="badge badge-purple">Redis 8 Cache</span>
      </div>
      <h1 className="doc-title">Mô hình Cơ sở Dữ liệu & Sơ đồ ERD</h1>
      <p className="doc-lead">
        Hệ thống áp dụng mô hình <strong>Database-per-Service</strong> chuẩn
        Microservices. Mỗi service backend sở hữu một schema/database độc lập
        trong PostgreSQL 16 (<code>auth</code> database cho{" "}
        <code>auth-service</code> sử dụng <strong>Prisma ORM</strong> và{" "}
        <code>users</code> database cho <code>user-service</code> sử dụng{" "}
        <strong>TypeORM</strong>). Quan hệ định danh giữa 2 database được liên
        kết phân tán (Distributed 1-to-1) thông qua cùng một mã khóa chính{" "}
        <strong>UUID</strong>.
      </p>

      {/* Embedded Archify Visualizer for ERD */}
      <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
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
            <IconDatabase size={22} className="w-5 h-5" /> Sơ đồ Thực thể Quan
            hệ Phân tán (Distributed ERD)
          </h2>
          <a
            href="/database-erd.html"
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
            src="/database-erd.html"
            title="Tomato Cinema Database Schema & Distributed ERD"
          />
        </div>
      </div>

      {/* Database Tabs & Schema Inspector */}
      <h2 className="section-heading">
        Chi tiết Cấu trúc Bảng & Khóa (Schema Inspector)
      </h2>

      <div className="tabs-header">
        <button
          className={`tab-btn ${selectedDbTab === "auth" ? "active" : ""}`}
          onClick={() => setSelectedDbTab("auth")}
        >
          🗄️ Auth DB (Prisma • 2 Tables + 1 Enum)
        </button>
        <button
          className={`tab-btn ${selectedDbTab === "users" ? "active" : ""}`}
          onClick={() => setSelectedDbTab("users")}
        >
          👤 Users DB (TypeORM • 1 Table)
        </button>
        <button
          className={`tab-btn ${selectedDbTab === "redis" ? "active" : ""}`}
          onClick={() => setSelectedDbTab("redis")}
        >
          ⚡ Redis Cache & Session Keys
        </button>
        <button
          className={`tab-btn ${selectedDbTab === "prisma-raw" ? "active" : ""}`}
          onClick={() => setSelectedDbTab("prisma-raw")}
        >
          📄 schema.prisma
        </button>
        <button
          className={`tab-btn ${selectedDbTab === "typeorm-raw" ? "active" : ""}`}
          onClick={() => setSelectedDbTab("typeorm-raw")}
        >
          📄 user.entity.ts
        </button>
      </div>

      {/* Tab: Auth DB */}
      {selectedDbTab === "auth" && (
        <div>
          {/* Table 1: Account */}
          <div className="doc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <h3
                style={{
                  color: "#38bdf8",
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>
                  📦 Bảng: <code>accounts</code>
                </span>
                <span className="badge badge-blue">Prisma Model: Account</span>
              </h3>
              <span className="badge badge-emerald">PostgreSQL 16</span>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                marginBottom: "0.75rem",
              }}
            >
              Lưu trữ danh tính xác thực cốt lõi của người dùng, trạng thái kích
              hoạt và phân quyền RBAC.
            </p>

            <div className="table-responsive">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Cột (Column)</th>
                    <th>Kiểu SQL</th>
                    <th>Kiểu Prisma</th>
                    <th>Ràng buộc (Constraints)</th>
                    <th>Mặc định</th>
                    <th>Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>id</strong>
                    </td>
                    <td>
                      <code>UUID</code>
                    </td>
                    <td>
                      <code>String</code>
                    </td>
                    <td>
                      <span className="badge badge-red">PK</span>
                    </td>
                    <td>
                      <code>uuid()</code>
                    </td>
                    <td>Khóa chính UUID sinh tự động</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>phone</strong>
                    </td>
                    <td>
                      <code>VARCHAR(20)</code>
                    </td>
                    <td>
                      <code>String?</code>
                    </td>
                    <td>
                      <span className="badge badge-amber">UNIQUE</span>{" "}
                      (Nullable)
                    </td>
                    <td>
                      <code>null</code>
                    </td>
                    <td>Số điện thoại đăng ký</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>email</strong>
                    </td>
                    <td>
                      <code>VARCHAR(255)</code>
                    </td>
                    <td>
                      <code>String?</code>
                    </td>
                    <td>
                      <span className="badge badge-amber">UNIQUE</span>{" "}
                      (Nullable)
                    </td>
                    <td>
                      <code>null</code>
                    </td>
                    <td>Địa chỉ Email xác thực</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>is_phone_verifed</strong>
                    </td>
                    <td>
                      <code>BOOLEAN</code>
                    </td>
                    <td>
                      <code>Boolean</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>false</code>
                    </td>
                    <td>Đánh dấu đã xác thực OTP qua SĐT</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>is_email_verifed</strong>
                    </td>
                    <td>
                      <code>BOOLEAN</code>
                    </td>
                    <td>
                      <code>Boolean</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>false</code>
                    </td>
                    <td>Đánh dấu đã xác thực OTP qua Email</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>role</strong>
                    </td>
                    <td>
                      <code>ENUM(Role)</code>
                    </td>
                    <td>
                      <code>Role</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>USER</code>
                    </td>
                    <td>
                      Quyền hạn hệ thống: <code>USER</code> hoặc{" "}
                      <code>ADMIN</code>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>telegram_id</strong>
                    </td>
                    <td>
                      <code>VARCHAR(64)</code>
                    </td>
                    <td>
                      <code>String?</code>
                    </td>
                    <td>
                      <span className="badge badge-amber">UNIQUE</span>{" "}
                      (Nullable)
                    </td>
                    <td>
                      <code>null</code>
                    </td>
                    <td>ID định danh Telegram cho luồng SSO</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>created_at</strong>
                    </td>
                    <td>
                      <code>TIMESTAMPTZ</code>
                    </td>
                    <td>
                      <code>DateTime</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>now()</code>
                    </td>
                    <td>Thời điểm tạo tài khoản</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>updated_at</strong>
                    </td>
                    <td>
                      <code>TIMESTAMPTZ</code>
                    </td>
                    <td>
                      <code>DateTime</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>@updatedAt</code>
                    </td>
                    <td>Thời điểm cập nhật mới nhất</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: PendingContactChange */}
          <div className="doc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <h3
                style={{
                  color: "#a855f7",
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>
                  📦 Bảng: <code>pending_contact_changes</code>
                </span>
                <span className="badge badge-purple">
                  Prisma Model: PendingContactChange
                </span>
              </h3>
              <span className="badge badge-emerald">PostgreSQL 16</span>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                marginBottom: "0.75rem",
              }}
            >
              Lưu trữ các yêu cầu đổi Email hoặc Số điện thoại đang chờ xác minh
              OTP. Có ràng buộc Unique kép để tránh spam bản ghi.
            </p>

            <div className="table-responsive">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Cột (Column)</th>
                    <th>Kiểu SQL</th>
                    <th>Kiểu Prisma</th>
                    <th>Ràng buộc (Constraints)</th>
                    <th>Mặc định</th>
                    <th>Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>id</strong>
                    </td>
                    <td>
                      <code>UUID</code>
                    </td>
                    <td>
                      <code>String</code>
                    </td>
                    <td>
                      <span className="badge badge-red">PK</span>
                    </td>
                    <td>
                      <code>uuid()</code>
                    </td>
                    <td>Khóa chính UUID</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>type</strong>
                    </td>
                    <td>
                      <code>VARCHAR(32)</code>
                    </td>
                    <td>
                      <code>String</code>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      Loại yêu cầu: <code>&apos;email&apos;</code> hoặc{" "}
                      <code>&apos;phone&apos;</code>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>value</strong>
                    </td>
                    <td>
                      <code>VARCHAR(255)</code>
                    </td>
                    <td>
                      <code>String</code>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      Giá trị mới cần đổi (vd: <code>new_email@gmail.com</code>)
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>code_hash</strong>
                    </td>
                    <td>
                      <code>VARCHAR(255)</code>
                    </td>
                    <td>
                      <code>String</code>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>Mã OTP 6 số đã được băm (hash bảo mật)</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>expires_at</strong>
                    </td>
                    <td>
                      <code>TIMESTAMPTZ</code>
                    </td>
                    <td>
                      <code>DateTime</code>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>Thời điểm mã OTP hết hạn (thường 5 phút)</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>accountId</strong>
                    </td>
                    <td>
                      <code>UUID</code>
                    </td>
                    <td>
                      <code>String?</code>
                    </td>
                    <td>
                      <span className="badge badge-blue">FK</span> ➔{" "}
                      <code>accounts.id</code> (Cascade)
                    </td>
                    <td>-</td>
                    <td>Khóa ngoại nối sang tài khoản</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>created_at</strong>
                    </td>
                    <td>
                      <code>TIMESTAMPTZ</code>
                    </td>
                    <td>
                      <code>DateTime</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>now()</code>
                    </td>
                    <td>Thời điểm khởi tạo yêu cầu</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>updated_at</strong>
                    </td>
                    <td>
                      <code>TIMESTAMPTZ</code>
                    </td>
                    <td>
                      <code>DateTime</code>
                    </td>
                    <td>-</td>
                    <td>
                      <code>@updatedAt</code>
                    </td>
                    <td>Thời điểm cập nhật</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.65rem 0.85rem",
                background: "rgba(168, 85, 247, 0.08)",
                borderRadius: "6px",
                border: "1px solid rgba(168, 85, 247, 0.2)",
                fontSize: "0.8rem",
                color: "#cbd5e1",
              }}
            >
              💡 <strong>Ràng buộc đặc biệt:</strong>{" "}
              <code>@@unique([accountId, type])</code> — Mỗi tài khoản tại 1
              thời điểm chỉ được phép có tối đa 1 yêu cầu đổi cho 1 loại, tránh
              tạo nhiều bản ghi rác khi gửi OTP liên tục.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users DB */}
      {selectedDbTab === "users" && (
        <div className="doc-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <h3
              style={{
                color: "#34d399",
                fontSize: "1.05rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>
                📦 Bảng: <code>users</code>
              </span>
              <span className="badge badge-emerald">
                TypeORM Entity: UserEntity
              </span>
            </h3>
            <span className="badge badge-blue">Users DB</span>
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              marginBottom: "0.75rem",
            }}
          >
            Quản lý hồ sơ công khai của người dùng (tên hiển thị, avatar). CSDL
            này hoàn toàn tách biệt với Auth DB để tối ưu hóa hiệu năng đọc/ghi
            độc lập.
          </p>

          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Cột (Column)</th>
                  <th>Kiểu SQL</th>
                  <th>Kiểu TypeORM</th>
                  <th>Ràng buộc (Constraints)</th>
                  <th>Mặc định</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>id</strong>
                  </td>
                  <td>
                    <code>UUID</code>
                  </td>
                  <td>
                    <code>@PrimaryColumn(&apos;uuid&apos;)</code>
                  </td>
                  <td>
                    <span className="badge badge-red">PK</span> (Distributed
                    Link)
                  </td>
                  <td>-</td>
                  <td>
                    Khóa chính UUID đồng bộ 1:1 với <code>accounts.id</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>name</strong>
                  </td>
                  <td>
                    <code>VARCHAR(255)</code>
                  </td>
                  <td>
                    <code>string | null</code>
                  </td>
                  <td>Nullable</td>
                  <td>
                    <code>null</code>
                  </td>
                  <td>Tên hiển thị của người dùng</td>
                </tr>
                <tr>
                  <td>
                    <strong>avatar</strong>
                  </td>
                  <td>
                    <code>VARCHAR(512)</code>
                  </td>
                  <td>
                    <code>string | null</code>
                  </td>
                  <td>Nullable</td>
                  <td>
                    <code>null</code>
                  </td>
                  <td>URL ảnh đại diện avatar</td>
                </tr>
                <tr>
                  <td>
                    <strong>created_at</strong>
                  </td>
                  <td>
                    <code>TIMESTAMPTZ</code>
                  </td>
                  <td>
                    <code>@CreateDateColumn()</code>
                  </td>
                  <td>-</td>
                  <td>
                    <code>now()</code>
                  </td>
                  <td>Thời điểm tạo hồ sơ</td>
                </tr>
                <tr>
                  <td>
                    <strong>updated_at</strong>
                  </td>
                  <td>
                    <code>TIMESTAMPTZ</code>
                  </td>
                  <td>
                    <code>@UpdateDateColumn()</code>
                  </td>
                  <td>-</td>
                  <td>
                    <code>now()</code>
                  </td>
                  <td>Thời điểm cập nhật hồ sơ</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.65rem 0.85rem",
              background: "rgba(16, 185, 129, 0.08)",
              borderRadius: "6px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontSize: "0.8rem",
              color: "#cbd5e1",
            }}
          >
            🔗 <strong>Cơ chế liên kết phân tán (Distributed 1:1):</strong>
            Khi người dùng hoàn tất đăng ký tại <code>auth-service</code>,{" "}
            <code>auth-service</code> gọi gRPC{" "}
            <code>
              UsersServiceClient.createUser({"{"} id: account.id {"}"})
            </code>{" "}
            sang <code>user-service</code>. Nhờ vậy, <code>UserEntity</code>{" "}
            mang chính xác UUID của <code>Account</code> mà không cần join
            database vật lý.
          </div>
        </div>
      )}

      {/* Tab: Redis */}
      {selectedDbTab === "redis" && (
        <div className="doc-card" id="redis-cache">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <h3 style={{ color: "#f87171", fontSize: "1.05rem" }}>
              ⚡ Cấu trúc Khóa Lưu trữ Redis Cache (Port :6379)
            </h3>
            <span className="badge badge-red">In-Memory Store</span>
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              marginBottom: "0.75rem",
            }}
          >
            Redis được dùng để giảm tải cho PostgreSQL, xử lý chống spam mã OTP
            và lưu trữ danh sách phiên đăng nhập (Token Whitelist/Blacklist).
          </p>

          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Mẫu Khóa (Key Pattern)</th>
                  <th>Kiểu Dữ liệu</th>
                  <th>Thời gian sống (TTL)</th>
                  <th>Mục đích sử dụng</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>
                      otp:{`{type}`}:{`{identifier}`}
                    </code>
                  </td>
                  <td>String / JSON Hash</td>
                  <td>
                    <code>300 giây (5 phút)</code>
                  </td>
                  <td>
                    Lưu mã OTP băm (hash) để đối chiếu khi người dùng xác thực.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>otp_throttle:{`{identifier}`}</code>
                  </td>
                  <td>String (Flag)</td>
                  <td>
                    <code>60 giây (1 phút)</code>
                  </td>
                  <td>Chống spam gửi mã liên tục (Rate Limit 1 OTP/phút).</td>
                </tr>
                <tr>
                  <td>
                    <code>
                      refresh_token:{`{accountId}`}:{`{tokenId}`}
                    </code>
                  </td>
                  <td>JSON String</td>
                  <td>
                    <code>7 ngày (604800s)</code>
                  </td>
                  <td>
                    Lưu thông tin phiên đăng nhập để thực hiện Refresh Token
                    Rotation.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>tg_session:{`{sessionId}`}</code>
                  </td>
                  <td>JSON String</td>
                  <td>
                    <code>600 giây (10 phút)</code>
                  </td>
                  <td>
                    Lưu trạng thái phiên tạm thời khi đăng nhập qua Telegram Bot
                    SSO.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Raw Prisma Schema */}
      {selectedDbTab === "prisma-raw" && (
        <CodeBlock
          language="prisma"
          title="apps/auth-service/prisma/schema.prisma"
          code={`// Khai báo công cụ sinh code tự động (Prisma Client)
generator client {
  provider     = "prisma-client"
  output       = "../generated"
  moduleFormat = "cjs"
}

// Cấu hình kết nối tới cơ sở dữ liệu PostgreSQL
datasource db {
  provider = "postgresql"
}

// BẢNG ACCOUNT: Lưu trữ thông tin Tài khoản người dùng
model Account {
  id String @id @default(uuid())

  phone String? @unique
  email String? @unique

  isPhoneVerified Boolean @default(false) @map("is_phone_verifed")
  isEmailVerified Boolean @default(false) @map("is_email_verifed")

  role Role @default(USER)

  telegramId String? @unique @map("telegram_id")

  // Mối quan hệ 1-N với PendingContactChange
  pendingContactChanges PendingContactChange[]

  createAt DateTime @default(now()) @map("created_at")
  updateAt DateTime @updatedAt @map("updated_at")

  @@map("accounts")
}

// BẢNG PENDING CONTACT CHANGE: Lưu các yêu cầu đổi thông tin / Gửi OTP
model PendingContactChange {
  id String @id @default(uuid())

  type      String
  value     String
  codeHash  String   @map("code_hash")
  expiresAt DateTime @map("expires_at")

  // Khóa ngoại nối với bảng Account (Xóa Account sẽ xóa sạch mã chờ xác nhận)
  account   Account? @relation(fields: [accountId], references: [id], onDelete: Cascade)
  accountId String?  @map("accountId")

  createAt DateTime @default(now()) @map("created_at")
  updateAt DateTime @updatedAt @map("updated_at")

  @@unique([accountId, type])
  @@map("pending_contact_changes")
}

// ENUM ROLE
enum Role {
  USER
  ADMIN

  @@map("roles")
}`}
        />
      )}

      {/* Tab: Raw TypeORM Entity */}
      {selectedDbTab === "typeorm-raw" && (
        <CodeBlock
          language="typescript"
          title="apps/user-service/src/modules/users/entites/user.entity.ts"
          code={`import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryColumn,
	UpdateDateColumn
} from 'typeorm'

@Entity({ name: 'users' })
export class UserEntity {
	@PrimaryColumn('uuid')
	public id: string

	@Column({ type: 'varchar', nullable: true })
	public name: string | null

	@Column({ type: 'varchar', nullable: true })
	public avatar: string | null

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	public createAt: Date

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	public updatedAt: Date
}`}
        />
      )}
    </section>
  );
}
