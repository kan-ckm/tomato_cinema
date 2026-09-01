"use client";

import React, { useState } from "react";
import { IconWorkflow, IconExternalLink } from "./Icons";
import { CodeBlock } from "./CodeBlock";

export function WorkflowsSection() {
  const [selectedFlow, setSelectedFlow] = useState<
    "otp" | "telegram" | "contact-change" | "token-rotation" | "observability"
  >("otp");
  const [activeStep, setActiveStep] = useState<number>(0);

  const flowsData = {
    otp: {
      title: "Luồng Xác thực Passwordless OTP (Đăng ký / Đăng nhập)",
      subtitle:
        "Bảo mật không mật khẩu, chống brute force và bất đồng bộ hóa việc gửi mã qua RabbitMQ",
      steps: [
        {
          title: "Bước 1: Client gửi yêu cầu cấp mã OTP",
          actor: "Client ➔ Gateway Service",
          protocol: "HTTP/1.1 REST (POST /api/v1/auth/otp/send)",
          description:
            "Người dùng nhập địa chỉ Email hoặc Số điện thoại trên Web Client. Gateway kiểm tra định dạng qua IdentifierValidator.",
          payload: `POST /api/v1/auth/otp/send
Content-Type: application/json

{
  "identifier": "tomato.dev@gmail.com",
  "type": "email"
}`,
          sideEffect:
            "Gateway gọi tiếp sang Auth Service qua gRPC auth.v1.AuthService/SendOtp.",
        },
        {
          title: "Bước 2: Auth Service kiểm tra Rate Limit & Lưu Redis",
          actor: "Auth Service ➔ Redis",
          protocol: "Redis RESP (SETEX / INCR)",
          description:
            "Auth Service kiểm tra khóa 'otp_throttle:tomato.dev@gmail.com'. Nếu chưa quá giới hạn (1 OTP/phút), hệ thống sinh mã ngẫu nhiên 6 chữ số, băm mật mã và lưu vào Redis với TTL 300s (5 phút).",
          payload: `REDIS SETEX "otp:email:tomato.dev@gmail.com" 300 "hash_sha256_code_894120"
REDIS SETEX "otp_throttle:tomato.dev@gmail.com" 60 "1"`,
          sideEffect:
            "Khóa throttle chặn người dùng bấm gửi liên tục gây spam hạ tầng.",
        },
        {
          title: "Bước 3: Phát tán sự kiện qua RabbitMQ",
          actor: "Auth Service ➔ RabbitMQ Broker",
          protocol:
            "AMQP 0-9-1 (Exchange: auth.events, RoutingKey: auth.otp_requested)",
          description:
            "Auth Service đẩy message chứa mã OTP và email người nhận vào hàng đợi RabbitMQ mà KHÔNG cần đợi email gửi xong.",
          payload: `// OtpRequestedEvent
{
  "identifier": "tomato.dev@gmail.com",
  "type": "email",
  "code": "894120",
  "expiresAt": "2026-09-01T13:15:00Z"
}`,
          sideEffect:
            "Auth Service phản hồi ngay lập tức cho Gateway { ok: true }, Client nhận 200 OK sau < 15ms.",
        },
        {
          title: "Bước 4: Notification Worker xử lý gửi Email",
          actor: "Notification Service ➔ SMTP / Exolve",
          protocol: "SMTP (Nodemailer) / HTTPS SMS API",
          description:
            "Notification Service lắng nghe hàng đợi 'notifications_queue', nhận message và render template Handlebars (otp.hbs) gửi email đến hòm thư người dùng.",
          payload: `Subject: "🍅 Tomato Cinema - Mã xác nhận đăng nhập"
Template: otp.hbs
Variables: { code: "894120", appName: "Tomato Cinema" }`,
          sideEffect:
            "Email hạ cánh an toàn trong Inbox người dùng trong vòng 1-2 giây.",
        },
        {
          title: "Bước 5: Người dùng nhập OTP để xác minh",
          actor: "Client ➔ Gateway ➔ Auth Service",
          protocol: "REST (POST /api/v1/auth/otp/verify) ➔ gRPC VerifyOtp()",
          description:
            "Client gửi mã 6 số. Auth Service đối chiếu với mã băm trong Redis. Nếu khớp, mã trong Redis bị tiêu hủy (consume) ngay để chống dùng lại.",
          payload: `POST /api/v1/auth/otp/verify
{
  "identifier": "tomato.dev@gmail.com",
  "type": "email",
  "code": "894120"
}`,
          sideEffect:
            "Nếu là tài khoản mới, Prisma tạo bản ghi Account. Sau đó Auth Service gọi gRPC sang User Service để khởi tạo UserEntity.",
        },
        {
          title: "Bước 6: Cấp Access Token & Set HttpOnly Cookie",
          actor: "Gateway ➔ Client",
          protocol: "HTTP 200 OK + Set-Cookie Header",
          description:
            "Gateway nhận Access Token (JWT ngắn hạn 15m) trả về JSON Body, đồng thời nhận Refresh Token (dài hạn 7 ngày) và gắn vào HttpOnly Cookie an toàn chống tấn công XSS.",
          payload: `HTTP/1.1 200 OK
Set-Cookie: refresh_token=rt_eyJhbGciOi...; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`,
          sideEffect:
            "Đăng nhập thành công! Client lưu access_token trong memory và redirect vào trang chủ.",
        },
      ],
    },
    telegram: {
      title: "Luồng Đăng nhập Telegram SSO Một chạm (Telegram SSO)",
      subtitle:
        "Xác thực tức thì bằng tài khoản Telegram với chữ ký HMAC-SHA256 bảo mật",
      steps: [
        {
          title: "Bước 1: Khởi tạo phiên liên kết Telegram",
          actor: "Client ➔ Gateway ➔ Auth Service",
          protocol: "GET /api/v1/auth/telegram/init ➔ gRPC TelegramInit()",
          description:
            "Client yêu cầu URL kết nối bot Telegram. Auth Service sinh session_id tạm thời và trả về link deep-link mở Bot.",
          payload: `Response:
{
  "url": "https://t.me/tomato_cinema_bot?start=sess_98af21d0"
}`,
          sideEffect: "Client mở cửa sổ Telegram hoặc hiển thị mã QR.",
        },
        {
          title: "Bước 2: Người dùng nhấn Start & Chia sẻ Số điện thoại",
          actor: "Telegram App ➔ Bot Service",
          protocol: "Telegram MTProto Webhook / Polling",
          description:
            "Người dùng nhấn /start sess_xxx và bấm nút 'Chia sẻ số điện thoại' trên giao diện Telegram Bot.",
          payload: `Telegram Message Context:
{
  "from": { "id": 123456789, "username": "tomato_dev" },
  "contact": { "phone_number": "+84988888888", "user_id": 123456789 }
}`,
          sideEffect:
            "Bot Service xác thực tính hợp lệ của contact và gọi gRPC sang Auth Service.",
        },
        {
          title: "Bước 3: Xác minh chữ ký dữ liệu (HMAC-SHA256)",
          actor: "Auth Service",
          protocol: "Internal Crypto Verification",
          description:
            "Auth Service kiểm tra chữ ký dữ liệu bằng TELEGRAM_BOT_TOKEN. Khớp Telegram ID với Account trong Database hoặc tạo mới nếu chưa tồn tại.",
          payload: `Crypto:
secret_key = SHA256(bot_token)
data_check_string = "auth_date=...\\nid=...\\nusername=..."
hash = HMAC_SHA256(data_check_string, secret_key)`,
          sideEffect:
            "Ghi nhận trạng thái phiên đăng nhập vào Redis key 'tg_session:sess_98af21d0'.",
        },
        {
          title: "Bước 4: Client tiêu thụ phiên (Consume Session)",
          actor: "Client ➔ Gateway ➔ Auth Service",
          protocol:
            "POST /api/v1/auth/telegram/consume ➔ gRPC TelegramConsume()",
          description:
            "Trang web Client kiểm tra phiên, nhận cặp Access Token / Refresh Token và hoàn tất đăng nhập mà không cần nhập OTP.",
          payload: `POST /api/v1/auth/telegram/consume
{
  "session_id": "sess_98af21d0"
}`,
          sideEffect:
            "Hoàn tất đăng nhập 1-chạm cực kỳ tiện lợi cho người dùng mobile.",
        },
      ],
    },
    "contact-change": {
      title: "Luồng Thay đổi Email / Số điện thoại (2-Step Verification)",
      subtitle:
        "Bảo vệ tài khoản với bảng PendingContactChange và mã xác nhận OTP trước khi cam kết CSDL",
      steps: [
        {
          title: "Bước 1: Người dùng khởi tạo đổi Email/SĐT",
          actor: "Client ➔ Gateway ➔ Auth Service",
          protocol: "POST /api/v1/account/email/init (Có Bearer JWT)",
          description:
            "Người dùng đã đăng nhập gửi yêu cầu đổi sang email mới. Gateway trích xuất user_id từ JWT token.",
          payload: `POST /api/v1/account/email/init
Authorization: Bearer eyJhbGciOi...
{
  "email": "new_tomato_box@gmail.com"
}`,
          sideEffect:
            "Prisma lưu bản ghi vào bảng 'pending_contact_changes' với code_hash và expires_at (5 phút).",
        },
        {
          title: "Bước 2: Gửi OTP đến địa chỉ MỚI",
          actor: "Auth Service ➔ RabbitMQ ➔ Notification Service",
          protocol: "AMQP Event: account.email_changed",
          description:
            "Notification Service gửi mã OTP 6 chữ số đến hòm thư 'new_tomato_box@gmail.com' để chứng minh quyền sở hữu hòm thư mới.",
          payload: `Event:
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "new_email": "new_tomato_box@gmail.com",
  "code": "551209"
}`,
          sideEffect:
            "Email cũ vẫn hoạt động bình thường cho đến khi mã OTP được xác nhận.",
        },
        {
          title: "Bước 3: Xác nhận mã OTP & Cập nhật CSDL",
          actor: "Client ➔ Gateway ➔ Auth Service",
          protocol: "POST /api/v1/account/email/confirm",
          description:
            "Người dùng nhập mã OTP nhận được ở email mới. Auth Service kiểm tra bảng 'pending_contact_changes'. Nếu đúng, Prisma cập nhật trường 'email' trong bảng 'accounts' và xóa bản ghi pending.",
          payload: `POST /api/v1/account/email/confirm
{
  "email": "new_tomato_box@gmail.com",
  "code": "551209"
}`,
          sideEffect:
            "Trường 'is_email_verifed' được đặt thành true. Địa chỉ email chính thức được cập nhật.",
        },
      ],
    },
    "token-rotation": {
      title: "Cơ chế Refresh Token Rotation & Quản lý Phiên Bảo mật",
      subtitle:
        "Ngăn chặn việc đánh cắp token bằng cách tự động hủy token cũ khi cấp token mới",
      steps: [
        {
          title: "Bước 1: Access Token hết hạn (401 Unauthorized)",
          actor: "Client ➔ Gateway",
          protocol: "HTTP/1.1 API Request",
          description:
            "Sau 15 phút, Access Token hết hạn. Client Interceptor tự động bắt mã lỗi 401 và gọi endpoint làm mới.",
          payload: `GET /api/v1/users/me
Authorization: Bearer <expired_token>
➔ Response: 401 Unauthorized`,
          sideEffect:
            "Client tạm dừng các request khác để tiến hành xoay token.",
        },
        {
          title: "Bước 2: Gửi Refresh Token trong HttpOnly Cookie",
          actor: "Client ➔ Gateway ➔ Auth Service",
          protocol: "POST /api/v1/auth/refresh (Cookie: refresh_token=...)",
          description:
            "Trình duyệt tự động gửi kèm cookie chứa Refresh Token. Gateway chuyển tiếp sang Auth Service qua gRPC.",
          payload: `POST /api/v1/auth/refresh
Cookie: refresh_token=rt_uuid_v4_abc123`,
          sideEffect:
            "Auth Service kiểm tra tính hợp lệ của Refresh Token trong Redis.",
        },
        {
          title: "Bước 3: Xoay Token (Token Rotation)",
          actor: "Auth Service ➔ Redis",
          protocol: "Redis Del + Set",
          description:
            "Auth Service HỦY NGAY LẬP TỨC Refresh Token cũ, sinh một Refresh Token MỚI và Access Token MỚI.",
          payload: `REDIS DEL "refresh_token:user_123:old_tid"
REDIS SETEX "refresh_token:user_123:new_tid" 604800 "{ user_id: 'user_123', role: 'USER' }"`,
          sideEffect:
            "Nếu token cũ bị ai đó cố tình dùng lại, hệ thống sẽ phát hiện hành vi xâm nhập và lập tức vô hiệu hóa toàn bộ phiên của người dùng đó.",
        },
        {
          title: "Bước 4: Cập nhật Cookie mới về Trình duyệt",
          actor: "Gateway ➔ Client",
          protocol: "Set-Cookie Header + New Access Token",
          description:
            "Client nhận Access Token mới và tiếp tục thực hiện lại request bị gián đoạn một cách mượt mà.",
          payload: `Set-Cookie: refresh_token=rt_uuid_v4_new_xyz...; HttpOnly; Secure; SameSite=Lax
{
  "access_token": "eyJhbGciOi...new_token"
}`,
          sideEffect: "Người dùng không bị gián đoạn trải nghiệm xem phim.",
        },
      ],
    },
    observability: {
      title: "Luồng Giám sát & Truy vết Phân tán (Distributed Tracing Flow)",
      subtitle:
        "Gom toàn bộ Metrcis, Logs và Traces vào OpenTelemetry Collector và hiển thị trên Grafana",
      steps: [
        {
          title: "Bước 1: Microservices phát tán OTLP Telemetry",
          actor: "Gateway / Auth / User ➔ OTel Collector",
          protocol: "OTLP gRPC (Port :4317) / OTLP HTTP (Port :4318)",
          description:
            "Mỗi khi có một request đi qua Gateway và gọi gRPC sang các service, OpenTelemetry SDK tự động đính kèm Trace ID và Span ID vào gRPC metadata.",
          payload: `Metadata Header:
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`,
          sideEffect:
            "Toàn bộ chuỗi gọi liên service được kết nối thành một Trace duy nhất.",
        },
        {
          title: "Bước 2: OTel Collector xử lý và phân luồng dữ liệu",
          actor: "OTel Collector ➔ Tempo / Loki / Prometheus",
          protocol: "Internal Pipelines",
          description:
            "Collector tiếp nhận, lọc và xuất dữ liệu đến 3 hệ thống backend chuyên biệt: Tempo (Traces), Loki (Logs), Prometheus (Metrics).",
          payload: `Pipeline:
- Traces ➔ Tempo (Port :3200)
- Metrics ➔ Prometheus (Port :9090)
- Logs ➔ Loki (Port :3100)`,
          sideEffect:
            "Giảm tải hoàn toàn việc thu thập log trên các node ứng dụng chính.",
        },
        {
          title: "Bước 3: Trực quan hóa trung tâm trên Grafana Dashboard",
          actor: "DevOps / Engineer ➔ Grafana Web Dashboard",
          protocol: "HTTP (http://localhost:3001)",
          description:
            "Kỹ sư mở Grafana để theo dõi biểu đồ tải CPU, RAM, thời gian phản hồi gRPC theo từng microservice và tra cứu log tập trung khi có sự cố.",
          payload: `Dashboard URL: http://localhost:3001
Dashboards:
- Tomato Cinema Microservices Health
- gRPC Latency & Request Rate (QPS)
- RabbitMQ Queue Depth & Consumer Lag`,
          sideEffect:
            "Phát hiện sự cố và nghẽn cổ chai hệ thống trong thời gian thực.",
        },
      ],
    },
  };

  const currentFlow = flowsData[selectedFlow];

  return (
    <section id="flow-otp" style={{ marginBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge-purple">Quy trình & Nghiệp vụ</span>
        <span className="badge badge-red">Interactive Stepper</span>
        <span className="badge badge-emerald">Sequence Flows</span>
      </div>
      <h1 className="doc-title">Sơ đồ Luồng Nghiệp vụ & Sequence Diagrams</h1>
      <p className="doc-lead">
        Trực quan hóa chi tiết cách các Microservices, Hàng đợi RabbitMQ, Bộ nhớ
        đệm Redis và Cơ sở dữ liệu PostgreSQL phối hợp xử lý từng ca nghiệp vụ
        theo thời gian thực.
      </p>

      {/* Embedded Archify Visualizer for Sequence Diagram */}
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
            <IconWorkflow size={22} className="w-5 h-5" /> Sơ đồ Trình tự Xác
            thực (Interactive Sequence Diagram)
          </h2>
          <a
            href="/auth-sequence.html"
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
            src="/auth-sequence.html"
            title="Tomato Cinema Sequence Flow"
          />
        </div>
      </div>

      {/* Flow Selector Tabs */}
      <h2 className="section-heading">
        Trình diễn Từng bước Nghiệp vụ (Step-by-Step Flow Player)
      </h2>

      <div className="tabs-header">
        <button
          className={`tab-btn ${selectedFlow === "otp" ? "active" : ""}`}
          onClick={() => {
            setSelectedFlow("otp");
            setActiveStep(0);
          }}
        >
          🔑 1. Passwordless OTP Flow
        </button>
        <button
          className={`tab-btn ${selectedFlow === "telegram" ? "active" : ""}`}
          onClick={() => {
            setSelectedFlow("telegram");
            setActiveStep(0);
          }}
        >
          ✈️ 2. Telegram SSO Flow
        </button>
        <button
          className={`tab-btn ${selectedFlow === "contact-change" ? "active" : ""}`}
          onClick={() => {
            setSelectedFlow("contact-change");
            setActiveStep(0);
          }}
        >
          ✉️ 3. Đổi Email / SĐT (2FA)
        </button>
        <button
          className={`tab-btn ${selectedFlow === "token-rotation" ? "active" : ""}`}
          onClick={() => {
            setSelectedFlow("token-rotation");
            setActiveStep(0);
          }}
        >
          🔄 4. Refresh Token Rotation
        </button>
        <button
          className={`tab-btn ${selectedFlow === "observability" ? "active" : ""}`}
          onClick={() => {
            setSelectedFlow("observability");
            setActiveStep(0);
          }}
        >
          📊 5. OpenTelemetry Tracing
        </button>
      </div>

      {/* Flow Header Card */}
      <div
        className="doc-card"
        style={{ borderLeft: "4px solid #ef4444", marginBottom: "1.5rem" }}
      >
        <h3 style={{ color: "#ffffff", fontSize: "1.15rem" }}>
          {currentFlow.title}
        </h3>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.85rem",
            marginTop: "0.25rem",
          }}
        >
          {currentFlow.subtitle}
        </p>

        {/* Step Progress Indicators */}
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            marginTop: "1rem",
            overflowX: "auto",
            paddingBottom: "0.4rem",
            scrollbarWidth: "thin",
          }}
        >
          {currentFlow.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                border:
                  activeStep === idx
                    ? "1px solid #ef4444"
                    : "1px solid var(--border-color)",
                background:
                  activeStep === idx ? "rgba(239, 68, 68, 0.2)" : "#1e293b",
                color: activeStep === idx ? "#f87171" : "#94a3b8",
                fontSize: "0.775rem",
                fontWeight: activeStep === idx ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                flexShrink: 0,
              }}
            >
              <span>{idx + 1}.</span>
              <span>{step.actor.split("➔")[0]?.trim()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Details */}
      <div className="doc-card" style={{ background: "#0b101b" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <span
              className="badge badge-red"
              style={{ marginBottom: "0.4rem" }}
            >
              Bước {activeStep + 1} / {currentFlow.steps.length}
            </span>
            <h3
              style={{
                color: "#38bdf8",
                fontSize: "1.1rem",
                marginTop: "0.2rem",
              }}
            >
              {currentFlow.steps[activeStep]?.title}
            </h3>
          </div>
          <span className="badge badge-purple" style={{ fontSize: "0.75rem" }}>
            {currentFlow.steps[activeStep]?.protocol}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Thành phần tương tác (Actor)
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#cbd5e1",
                fontWeight: 600,
                marginTop: "0.15rem",
              }}
            >
              {currentFlow.steps[activeStep]?.actor}
            </p>

            <p
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: 700,
                marginTop: "0.85rem",
              }}
            >
              Mô tả chi tiết nghiệp vụ
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                marginTop: "0.15rem",
                lineHeight: 1.55,
              }}
            >
              {currentFlow.steps[activeStep]?.description}
            </p>

            <p
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: 700,
                marginTop: "0.85rem",
              }}
            >
              Tác động CSDL / Hạ tầng (Side Effects)
            </p>
            <div
              style={{
                marginTop: "0.25rem",
                padding: "0.55rem 0.75rem",
                background: "rgba(16, 185, 129, 0.08)",
                borderRadius: "6px",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontSize: "0.8rem",
                color: "#34d399",
              }}
            >
              ✓ {currentFlow.steps[activeStep]?.sideEffect}
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: "0.35rem",
              }}
            >
              Dữ liệu & Payload truyền tải (Payload Format)
            </p>
            <CodeBlock
              language="json"
              title={currentFlow.steps[activeStep]?.protocol || "Payload"}
              code={currentFlow.steps[activeStep]?.payload || ""}
            />
          </div>
        </div>

        {/* Step Navigation Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "0.85rem",
            marginTop: "0.85rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            style={{
              padding: "0.45rem 0.85rem",
              background:
                activeStep === 0 ? "rgba(255,255,255,0.02)" : "#1e293b",
              color: activeStep === 0 ? "#475569" : "#cbd5e1",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: activeStep === 0 ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            ← Bước trước
          </button>

          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Bước {activeStep + 1} / {currentFlow.steps.length}
          </span>

          <button
            onClick={() =>
              setActiveStep(
                Math.min(currentFlow.steps.length - 1, activeStep + 1),
              )
            }
            disabled={activeStep === currentFlow.steps.length - 1}
            style={{
              padding: "0.45rem 0.85rem",
              background:
                activeStep === currentFlow.steps.length - 1
                  ? "rgba(255,255,255,0.02)"
                  : "#ef4444",
              color:
                activeStep === currentFlow.steps.length - 1
                  ? "#475569"
                  : "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor:
                activeStep === currentFlow.steps.length - 1
                  ? "not-allowed"
                  : "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            Bước tiếp theo →
          </button>
        </div>
      </div>
    </section>
  );
}
