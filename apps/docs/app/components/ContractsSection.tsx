"use client";

import React, { useState } from "react";
import { IconRabbitMQ } from "./Icons";
import { CodeBlock } from "./CodeBlock";

export function ContractsSection() {
  const [activeContractTab, setActiveContractTab] = useState<
    "rest" | "proto-auth" | "proto-account" | "proto-users" | "rmq-events"
  >("rest");

  const restEndpoints = [
    {
      group: "1. Nhóm Xác thực (Authentication — /api/v1/auth)",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/auth/otp/send",
          summary: "Gửi mã OTP qua Email hoặc Số điện thoại",
          guard: "Public",
          body: `{ "identifier": "user@example.com", "type": "email" }`,
          response: `HTTP 200 OK: { "ok": true }`,
          grpcCall: "AuthService.SendOtp(SendOtpRequest)",
        },
        {
          method: "POST",
          path: "/api/v1/auth/otp/verify",
          summary: "Xác minh mã OTP và cấp phát cặp Access / Refresh Token",
          guard: "Public",
          body: `{ "identifier": "user@example.com", "type": "email", "code": "123456" }`,
          response: `HTTP 200 OK + Set-Cookie (refresh_token):\n{ "access_token": "eyJhbGciOi..." }`,
          grpcCall: "AuthService.VerifyOtp(VerifyOtpRequest)",
        },
        {
          method: "POST",
          path: "/api/v1/auth/refresh",
          summary: "Làm mới Access Token & Xoay Refresh Token (Rotation)",
          guard: "HttpOnly Cookie: refresh_token",
          body: `Không yêu cầu body (đọc từ Cookie)`,
          response: `HTTP 200 OK + Set-Cookie (new_refresh_token):\n{ "access_token": "eyJhbGciOi...new" }`,
          grpcCall: "AuthService.Refresh(RefreshRequest)",
        },
        {
          method: "GET",
          path: "/api/v1/auth/telegram/init",
          summary: "Khởi tạo URL deep-link đăng nhập qua Telegram Bot",
          guard: "Public",
          body: `None`,
          response: `HTTP 200 OK: { "url": "https://t.me/bot?start=sess_xyz" }`,
          grpcCall: "AuthService.TelegramInit(Empty)",
        },
        {
          method: "POST",
          path: "/api/v1/auth/telegram/consume",
          summary: "Tiêu thụ phiên đăng nhập Telegram đã xác minh để lấy Token",
          guard: "Public",
          body: `{ "session_id": "sess_xyz" }`,
          response: `HTTP 200 OK + Set-Cookie:\n{ "access_token": "eyJhbGciOi..." }`,
          grpcCall: "AuthService.TelegramConsume(TelegramConsumeRequest)",
        },
      ],
    },
    {
      group: "2. Nhóm Tài khoản & Đổi thông tin (Account — /api/v1/account)",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/account",
          summary:
            "Lấy thông tin tài khoản hiện tại (email, phone, role, verification status)",
          guard: "JWT Bearer (@Protected())",
          body: `None`,
          response: `HTTP 200 OK:\n{\n  "id": "123e4567-e89b...",\n  "email": "user@gmail.com",\n  "is_email_verified": true,\n  "role": "USER"\n}`,
          grpcCall: "AccountService.GetAccount(GetAccountRequest)",
        },
        {
          method: "POST",
          path: "/api/v1/account/email/init",
          summary: "Khởi tạo yêu cầu đổi Email (gửi OTP sang Email mới)",
          guard: "JWT Bearer (@Protected())",
          body: `{ "email": "new_email@gmail.com" }`,
          response: `HTTP 200 OK: { "ok": true }`,
          grpcCall: "AccountService.InitEmailChange(InitEmailChangeRequest)",
        },
        {
          method: "POST",
          path: "/api/v1/account/email/confirm",
          summary: "Xác nhận mã OTP để hoàn tất cập nhật Email mới",
          guard: "JWT Bearer (@Protected())",
          body: `{ "email": "new_email@gmail.com", "code": "654321" }`,
          response: `HTTP 200 OK: { "ok": true }`,
          grpcCall:
            "AccountService.ConfirmEmailChange(ConfirmEmailChangeRequest)",
        },
        {
          method: "POST",
          path: "/api/v1/account/phone/init",
          summary: "Khởi tạo yêu cầu đổi Số điện thoại (gửi SMS OTP)",
          guard: "JWT Bearer (@Protected())",
          body: `{ "phone": "+84988888888" }`,
          response: `HTTP 200 OK: { "ok": true }`,
          grpcCall: "AccountService.InitPhoneChange(InitPhoneChangeRequest)",
        },
        {
          method: "POST",
          path: "/api/v1/account/phone/confirm",
          summary: "Xác nhận mã OTP để hoàn tất cập nhật Số điện thoại mới",
          guard: "JWT Bearer (@Protected())",
          body: `{ "phone": "+84988888888", "code": "654321" }`,
          response: `HTTP 200 OK: { "ok": true }`,
          grpcCall:
            "AccountService.ConfirmPhoneChange(ConfirmPhoneChangeRequest)",
        },
      ],
    },
    {
      group: "3. Nhóm Hồ sơ Người dùng (Users — /api/v1/users)",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/users/me",
          summary: "Lấy hồ sơ người dùng đầy đủ (tên, avatar, email, phone)",
          guard: "JWT Bearer (@Protected())",
          body: `None`,
          response: `HTTP 200 OK:\n{\n  "user": {\n    "id": "123e4567-e89b...",\n    "name": "Tomato Dev",\n    "avatar": "https://...",\n    "email": "user@gmail.com"\n  }\n}`,
          grpcCall: "UsersService.GetMe(GetMeRequest)",
        },
        {
          method: "PATCH",
          path: "/api/v1/users",
          summary: "Cập nhật thông tin hồ sơ (tên hiển thị, avatar)",
          guard: "JWT Bearer (@Protected())",
          body: `{ "name": "Tomato Super Dev" }`,
          response: `HTTP 200 OK: { "ok": true }`,
          grpcCall: "UsersService.PatchUser(PatchUserRequest)",
        },
      ],
    },
  ];

  return (
    <section id="api-rest" style={{ marginBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge-cyan">Hợp đồng & Tham chiếu</span>
        <span className="badge badge-amber">API Gateway REST</span>
        <span className="badge badge-blue">gRPC Protocol Buffers</span>
      </div>
      <h1 className="doc-title">Hợp đồng Giao tiếp & Tham chiếu API</h1>
      <p className="doc-lead">
        Toàn bộ giao tiếp giữa Client và Hệ thống được tài liệu hóa minh bạch.
        API Gateway cung cấp REST Endpoints với OpenAPI/Swagger, trong khi các
        Microservices bên trong giao tiếp với nhau bằng Protocol Buffers 3
        (.proto) cực kỳ an toàn và chuẩn xác kiểu dữ liệu.
      </p>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeContractTab === "rest" ? "active" : ""}`}
          onClick={() => setActiveContractTab("rest")}
        >
          🌐 REST Endpoints (Gateway Service :3500)
        </button>
        <button
          className={`tab-btn ${activeContractTab === "proto-auth" ? "active" : ""}`}
          onClick={() => setActiveContractTab("proto-auth")}
        >
          🛡️ proto/auth.proto
        </button>
        <button
          className={`tab-btn ${activeContractTab === "proto-account" ? "active" : ""}`}
          onClick={() => setActiveContractTab("proto-account")}
        >
          👤 proto/account.proto
        </button>
        <button
          className={`tab-btn ${activeContractTab === "proto-users" ? "active" : ""}`}
          onClick={() => setActiveContractTab("proto-users")}
        >
          📋 proto/users.proto
        </button>
        <button
          className={`tab-btn ${activeContractTab === "rmq-events" ? "active" : ""}`}
          onClick={() => setActiveContractTab("rmq-events")}
        >
          🐇 RabbitMQ Event Interfaces
        </button>
      </div>

      {/* Tab 1: REST Endpoints */}
      {activeContractTab === "rest" && (
        <div>
          {restEndpoints.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: "2rem" }}>
              <h2
                className="section-heading"
                style={{ fontSize: "1.2rem", color: "#38bdf8" }}
              >
                {group.group}
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  marginTop: "0.85rem",
                }}
              >
                {group.endpoints.map((ep, eIdx) => (
                  <div
                    key={eIdx}
                    className="doc-card"
                    style={{ marginBottom: 0 }}
                  >
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          className={`badge ${
                            ep.method === "GET"
                              ? "badge-emerald"
                              : ep.method === "POST"
                                ? "badge-blue"
                                : "badge-amber"
                          }`}
                          style={{ fontWeight: 800, padding: "0.2rem 0.45rem" }}
                        >
                          {ep.method}
                        </span>
                        <code
                          style={{
                            fontSize: "0.875rem",
                            color: "#ffffff",
                            fontWeight: 600,
                            wordBreak: "break-all",
                          }}
                        >
                          {ep.path}
                        </code>
                      </div>
                      <span
                        className="badge badge-purple"
                        style={{ fontSize: "0.72rem" }}
                      >
                        {ep.guard}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                        marginBottom: "0.6rem",
                      }}
                    >
                      {ep.summary}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "0.75rem",
                        background: "#0b101b",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.775rem",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            fontSize: "0.68rem",
                          }}
                        >
                          Payload Request Body:
                        </span>
                        <pre
                          style={{
                            color: "#cbd5e1",
                            marginTop: "0.2rem",
                            fontFamily: "var(--font-mono)",
                            overflowX: "auto",
                            fontSize: "0.75rem",
                          }}
                        >
                          {ep.body}
                        </pre>
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            fontSize: "0.68rem",
                          }}
                        >
                          Expected Response & gRPC Mapping:
                        </span>
                        <pre
                          style={{
                            color: "#34d399",
                            marginTop: "0.2rem",
                            fontFamily: "var(--font-mono)",
                            overflowX: "auto",
                            fontSize: "0.75rem",
                          }}
                        >
                          {ep.response}
                        </pre>
                        <div
                          style={{
                            marginTop: "0.3rem",
                            color: "#60a5fa",
                            fontSize: "0.72rem",
                          }}
                        >
                          ➔ Gọi nội bộ: <code>{ep.grpcCall}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: proto/auth.proto */}
      {activeContractTab === "proto-auth" && (
        <div id="grpc-proto">
          <CodeBlock
            language="protobuf"
            title="packages/contracts/proto/auth.proto"
            code={`syntax = "proto3";

// Khai báo package name cho gRPC namespace
package auth.v1;

import "google/protobuf/empty.proto"; 

// SERVICE: AuthService — Quản lý toàn bộ xác thực OTP & Telegram SSO
service AuthService {
    // Nhóm tính năng Xác thực không mật khẩu (OTP)
    rpc SendOtp(SendOtpRequest) returns (SendOtpResponse);
    rpc VerifyOtp(VerifyOtpRequest) returns (VerifyOtpResponse);
    rpc Refresh(RefreshRequest) returns (RefreshResponse);

    // Nhóm tính năng Đăng nhập qua Telegram SSO
    rpc TelegramInit(google.protobuf.Empty) returns (TelegramInitResponse); 
    rpc TelegramVerify(TelegramVerifyRequest) returns (TelegramVerifyResponse);
    rpc TelegramComplete(TelegramCompleteRequest) returns (TelegramCompleteResponse);
    rpc TelegramConsume(TelegramConsumeRequest) returns (TelegramConsumeResponse);
}

// Request & Response Messages
message SendOtpRequest {
    string identifier = 1; // Email hoặc SĐT
    string type = 2;       // "email" hoặc "phone"
}

message SendOtpResponse {
    bool ok = 1;
}

message VerifyOtpRequest {
    string identifier = 1;
    string type = 2;
    string code = 3;       // Mã 6 số OTP
}

message VerifyOtpResponse {
    string access_token = 1;
    string refresh_token = 2;
}

message RefreshRequest {
    string refresh_token = 1;
}

message RefreshResponse {
    string access_token = 1;
    string refresh_token = 2;
}

message TelegramInitResponse {
    string url = 1; // Link URL để mở Bot Telegram kèm session_id
}

message TelegramVerifyRequest {
    map<string, string> query = 1; // Query parameters từ Telegram Webhook
}

message TelegramVerifyResponse {
    oneof result {
        string url = 1;           // Chuyển hướng bổ sung thông tin
        string access_token = 2;  // Đăng nhập thành công -> Cấp Token
        string refresh_token = 3;
    }
}

message TelegramCompleteRequest {
    string session_id = 1;
    string phone = 2;
}

message TelegramCompleteResponse {
    string session_id = 1;
}

message TelegramConsumeRequest {
    string session_id = 1;
}

message TelegramConsumeResponse {
    string access_token = 1;
    string refresh_token = 2;
}`}
          />
        </div>
      )}

      {/* Tab 3: proto/account.proto */}
      {activeContractTab === "proto-account" && (
        <CodeBlock
          language="protobuf"
          title="packages/contracts/proto/account.proto"
          code={`syntax = "proto3";

package account.v1;

// SERVICE: AccountService — Quản lý thông tin tài khoản và đổi SĐT/Email
service AccountService {
    // Lấy thông tin tài khoản
    rpc GetAccount (GetAccountRequest) returns (GetAccountResponse);

    // Đổi email (2FA OTP)
    rpc InitEmailChange (InitEmailChangeRequest) returns (InitEmailChangeResponse);
    rpc ConfirmEmailChange (ConfirmEmailChangeRequest) returns (ConfirmEmailChangeResponse);
    
    // Đổi số điện thoại (2FA OTP)
    rpc InitPhoneChange (InitPhoneChangeRequest) returns (InitPhoneChangeResponse);
    rpc ConfirmPhoneChange (ConfirmPhoneChangeRequest) returns (ConfirmPhoneChangeResponse);
}

message GetAccountRequest {
    string id = 1;
}

message GetAccountResponse {
    string id = 1;
    string phone = 2;
    string email = 3;
    bool is_phone_verified = 4;
    bool is_email_verified = 5;
    RoleUser role = 6;
}

message InitEmailChangeRequest {
    string email = 1;
    string user_id = 2;
}

message InitEmailChangeResponse {
    bool ok = 1; 
}

message ConfirmEmailChangeRequest {
    string email = 1;
    string code = 2;
    string user_id = 3;
}

message ConfirmEmailChangeResponse {
    bool ok = 1;
}

message InitPhoneChangeRequest {
    string phone = 1;
    string user_id = 2;
}

message InitPhoneChangeResponse {
    bool ok = 1; 
}

message ConfirmPhoneChangeRequest {
    string phone = 1;
    string code = 2;
    string user_id = 3;
}

message ConfirmPhoneChangeResponse {
    bool ok = 1;
}

enum RoleUser {
    USER = 0;
    ADMIN = 1;
}`}
        />
      )}

      {/* Tab 4: proto/users.proto */}
      {activeContractTab === "proto-users" && (
        <CodeBlock
          language="protobuf"
          title="packages/contracts/proto/users.proto"
          code={`syntax = "proto3";

package users.v1;

// SERVICE: UsersService — Quản lý hồ sơ cá nhân của người dùng
service UsersService {
    // Lấy hồ sơ người dùng
    rpc GetMe(GetMeRequest) returns (GetMeResponse);

    // Tạo bản ghi User khi Auth Service hoàn tất đăng ký
    rpc CreateUser (CreateUserRequest) returns (CreateUserResponse);

    // Cập nhật thông tin profile (tên hiển thị, avatar)
    rpc PatchUser (PatchUserRequest) returns (PatchUserResponse);
}

message GetMeRequest {
    string id = 1;
}

message GetMeResponse {
    User user = 1;
}

message CreateUserRequest {
    string id = 1; // UUID đồng bộ từ Account.id
}

message CreateUserResponse {
    bool ok = 1;
}

message PatchUserRequest {
    string user_id = 1;
    optional string name = 2;
}

message PatchUserResponse {
    bool ok = 1;
}

message User {
    string id = 1;
    optional string name = 2;
    optional string phone = 3;      
    optional string email = 4;
    optional string avatar = 5;
}`}
        />
      )}

      {/* Tab 5: RabbitMQ Event Contracts */}
      {activeContractTab === "rmq-events" && (
        <div id="flow-rabbitmq">
          <div className="doc-card" style={{ marginBottom: "1rem" }}>
            <h3
              style={{
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <IconRabbitMQ size={18} className="w-5 h-5" /> Hợp đồng Sự kiện
              Bất đồng bộ (RabbitMQ Event Payloads)
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                margin: "0.5rem 0",
              }}
            >
              Các sự kiện được định nghĩa trong{" "}
              <code>packages/contracts/src/events/*</code> giúp đảm bảo tính
              tương thích kiểu dữ liệu (Type Safety) giữa Producer (Auth
              Service) và Consumer (Notification Service).
            </p>
          </div>

          <CodeBlock
            language="typescript"
            title="packages/contracts/src/events/auth/otp-requested.interface.ts"
            code={`export interface OtpRequestedEvent {
  identifier: string; // Email hoặc Số điện thoại
  type: 'email' | 'phone';
  code: string;       // Mã OTP 6 chữ số
  expiresAt: Date;    // Thời điểm hết hạn (5 phút)
}`}
          />

          <CodeBlock
            language="typescript"
            title="packages/contracts/src/events/account/email-changed.interface.ts"
            code={`export interface EmailChangedEvent {
  userId: string;     // ID tài khoản
  newEmail: string;   // Địa chỉ email mới cần xác nhận
  code: string;       // Mã OTP
  expiresAt: Date;
}`}
          />
        </div>
      )}
    </section>
  );
}
