"use client";

import React, { useState } from "react";
import { IconPackage, IconExternalLink } from "./Icons";
import { CodeBlock } from "./CodeBlock";

export function MonorepoSection() {
  const [activePkgTab, setActivePkgTab] = useState<
    "diagram" | "contracts" | "common" | "passport" | "core" | "ui"
  >("diagram");

  return (
    <section id="monorepo-deps" style={{ marginBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="badge badge-emerald">Monorepo Topology</span>
        <span className="badge badge-blue">pnpm workspace</span>
        <span className="badge badge-purple">Turborepo</span>
      </div>
      <h1 className="doc-title">Mô hình Kết nối các Packages trong Monorepo</h1>
      <p className="doc-lead">
        Dự án sử dụng <strong>pnpm workspace</strong> kết hợp{" "}
        <strong>Turborepo</strong> để quản lý toàn bộ các ứng dụng (
        <code>apps/</code>) và các thư viện dùng chung (<code>packages/</code>).
        Các package được thiết kế theo nguyên lý phân tách trách nhiệm cao
        (Separation of Concerns), giúp tái sử dụng mã nguồn, đồng bộ kiểu dữ
        liệu (Type Safety) và tối ưu hóa thời gian build thông qua Remote
        Caching.
      </p>

      {/* Embedded Archify Visualizer for Packages */}
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
            <IconPackage size={22} className="w-5 h-5" /> Sơ đồ Luồng Phụ thuộc
            Packages (Interactive Diagram)
          </h2>
          <a
            href="/packages-diagram.html"
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
            src="/packages-diagram.html"
            title="Tomato Cinema Monorepo Packages Topology"
          />
        </div>
      </div>

      {/* Package Tabs & Code Deep Dives */}
      <h2 className="section-heading">
        Khám phá Chi tiết Từng Package & Logic Cốt lõi
      </h2>

      <div className="tabs-header">
        <button
          className={`tab-btn ${activePkgTab === "diagram" ? "active" : ""}`}
          onClick={() => setActivePkgTab("diagram")}
        >
          📊 Ma trận Phụ thuộc (Matrix)
        </button>
        <button
          className={`tab-btn ${activePkgTab === "contracts" ? "active" : ""}`}
          onClick={() => setActivePkgTab("contracts")}
        >
          📦 @tomatocinema/contracts
        </button>
        <button
          className={`tab-btn ${activePkgTab === "common" ? "active" : ""}`}
          onClick={() => setActivePkgTab("common")}
        >
          ⚙️ @tomatocinema/common (Dynamic GrpcModule)
        </button>
        <button
          className={`tab-btn ${activePkgTab === "passport" ? "active" : ""}`}
          onClick={() => setActivePkgTab("passport")}
        >
          🛡️ @tomatocinema/passport
        </button>
        <button
          className={`tab-btn ${activePkgTab === "ui" ? "active" : ""}`}
          onClick={() => setActivePkgTab("ui")}
        >
          🎨 @repo/ui
        </button>
      </div>

      {/* Tab: Matrix */}
      {activePkgTab === "diagram" && (
        <div className="doc-card">
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Ứng dụng (App)</th>
                  <th>@tomatocinema/contracts</th>
                  <th>@tomatocinema/common</th>
                  <th>@tomatocinema/passport</th>
                  <th>@tomatocinema/core</th>
                  <th>@repo/ui</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>apps/gateway-service</strong>
                  </td>
                  <td>
                    <span className="badge badge-emerald">
                      gRPC Clients & Types
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">
                      Filters & Decorators
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">JWT Guard</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">DTOs</span>
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <strong>apps/auth-service</strong>
                  </td>
                  <td>
                    <span className="badge badge-emerald">
                      gRPC Server & Events
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">Common Utils</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">Token Signer</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">Interfaces</span>
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <strong>apps/user-service</strong>
                  </td>
                  <td>
                    <span className="badge badge-emerald">gRPC Server</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">Common Utils</span>
                  </td>
                  <td>-</td>
                  <td>
                    <span className="badge badge-emerald">Interfaces</span>
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <strong>apps/notification-service</strong>
                  </td>
                  <td>
                    <span className="badge badge-emerald">
                      Event Interfaces
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">RMQ Helper</span>
                  </td>
                  <td>-</td>
                  <td>
                    <span className="badge badge-emerald">DTOs</span>
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <strong>apps/bot-service</strong>
                  </td>
                  <td>
                    <span className="badge badge-emerald">gRPC Client</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">Common Utils</span>
                  </td>
                  <td>-</td>
                  <td>
                    <span className="badge badge-emerald">Interfaces</span>
                  </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <strong>apps/web</strong>
                  </td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>
                    <span className="badge badge-red">React UI Components</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>apps/docs</strong>
                  </td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>
                    <span className="badge badge-red">React UI Components</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Contracts */}
      {activePkgTab === "contracts" && (
        <div>
          <div className="doc-card">
            <h3 style={{ color: "#22d3ee" }}>
              @tomatocinema/contracts — Single Source of Truth
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                margin: "0.5rem 0",
              }}
            >
              Nơi định nghĩa các hợp đồng liên dịch vụ. Thay vì viết TypeScript
              interface thủ công ở từng service, toàn bộ interface, DTOs và RPC
              methods được sinh tự động bằng <code>ts-proto</code> từ file{" "}
              <code>.proto</code> chuẩn gRPC.
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "0.85rem",
                color: "#cbd5e1",
              }}
            >
              <li>
                <code>proto/auth.proto</code>: Các phương thức xác thực OTP,
                Telegram SSO, Refresh Token.
              </li>
              <li>
                <code>proto/account.proto</code>: Quản lý tài khoản, quy trình
                2FA đổi Email/Số điện thoại.
              </li>
              <li>
                <code>proto/users.proto</code>: Hồ sơ người dùng, lấy thông tin
                cá nhân (GetMe), cập nhật (PatchUser).
              </li>
              <li>
                <code>src/events/*</code>: Định nghĩa kiểu dữ liệu sự kiện gửi
                qua RabbitMQ.
              </li>
            </ul>
          </div>
          <CodeBlock
            language="bash"
            title="Lệnh biên dịch Protobuf tự động"
            code="pnpm --filter @tomatocinema/contracts build"
          />
        </div>
      )}

      {/* Tab: Common */}
      {activePkgTab === "common" && (
        <div>
          <div className="doc-card">
            <h3 style={{ color: "#60a5fa" }}>
              @tomatocinema/common — Dynamic GrpcModule & Helpers
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                margin: "0.5rem 0",
              }}
            >
              Đóng gói các công cụ kiến trúc NestJS nâng cao:
            </p>
            <ul
              style={{
                paddingLeft: "1.25rem",
                fontSize: "0.85rem",
                color: "#cbd5e1",
                marginBottom: "0.75rem",
              }}
            >
              <li>
                <code>GrpcModule.forFeature()</code>: DynamicModule tự động cấu
                hình gRPC Client theo tên package (<code>AUTH_PACKAGE</code>,{" "}
                <code>ACCOUNT_PACKAGE</code>, <code>USERS_PACKAGE</code>).
              </li>
              <li>
                <code>AbstractGrpcClient</code>: Wrapper thông minh tự động
                chuyển đổi <code>Observable</code> của RxJS sang{" "}
                <code>Promise</code>, giúp Controller viết code{" "}
                <code>async/await</code> tự nhiên.
              </li>
              <li>
                <code>@InjectGrpcClient()</code>: Parameter decorator tự động
                inject Client gRPC tương ứng.
              </li>
              <li>
                <code>GrpcExceptionFilter</code>: Tự động chuyển đổi mã lỗi gRPC
                (NOT_FOUND, UNAUTHENTICATED, ALREADY_EXISTS) sang mã HTTP (404,
                401, 409).
              </li>
            </ul>
          </div>

          <CodeBlock
            language="typescript"
            title="packages/common/src/lib/grpc/grpc.module.ts"
            code={`@Module({})
export class GrpcModule {
  static forRoot(options: GrpcModuleOptions): DynamicModule {
    return {
      module: GrpcModule,
      providers: [
        {
          provide: GRPC_OPTIONS,
          useValue: options,
        },
      ],
      exports: [GRPC_OPTIONS],
    };
  }

  static forFeature(packages: string[]): DynamicModule {
    const providers = packages.map((pkg) => ({
      provide: getGrpcClientToken(pkg),
      useFactory: (options: GrpcModuleOptions) => GrpcClientFactory.create(pkg, options),
      inject: [GRPC_OPTIONS],
    }));

    return {
      module: GrpcModule,
      providers: providers,
      exports: providers,
    };
  }
}`}
          />
        </div>
      )}

      {/* Tab: Passport */}
      {activePkgTab === "passport" && (
        <div>
          <div className="doc-card">
            <h3 style={{ color: "#c084fc" }}>
              @tomatocinema/passport — Module Xác thực JWT & Guard
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                margin: "0.5rem 0",
              }}
            >
              Module tái sử dụng cho cả <code>gateway-service</code> và{" "}
              <code>auth-service</code> để tạo, ký mã và xác minh JWT Access /
              Refresh Token, kèm các hàm mã hóa mật mã học (Crypto/Base64).
            </p>
          </div>

          <CodeBlock
            language="typescript"
            title="packages/passport/lib/passport.service.ts"
            code={`@Injectable()
export class PassportService {
  constructor(
    @Inject(PASSPORT_OPTIONS) private readonly options: PassportOptions
  ) {}

  public signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.options.secretKey, {
      expiresIn: this.options.accessTtl || '15m',
    });
  }

  public verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.options.secretKey) as JwtPayload;
  }
}`}
          />
        </div>
      )}

      {/* Tab: UI */}
      {activePkgTab === "ui" && (
        <div className="doc-card">
          <h3 style={{ color: "#f87171" }}>
            @repo/ui — Shared React Components
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              margin: "0.5rem 0",
            }}
          >
            Cung cấp các component React tái sử dụng cho các ứng dụng Next.js (
            <code>apps/web</code> và <code>apps/docs</code>).
          </p>
          <CodeBlock
            language="tsx"
            title="packages/ui/src/button.tsx"
            code={`import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  appName?: string;
}

export function Button({ appName, children, className, ...props }: ButtonProps) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}`}
          />
        </div>
      )}
    </section>
  );
}
