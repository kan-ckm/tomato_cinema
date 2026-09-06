# TOMATO CINEMA — CODEBASE & CORE SERVICES IMPLEMENTATION

> **Project Name:** Tomato Cinema (`tomato_cinema`)  
> **Source Directory:** `apps/` and `packages/`  
> **Language & Frameworks:** TypeScript, NestJS 11, Next.js 16, Prisma ORM, TypeORM, Telegraf, Nodemailer, RxJS.

---

## 1. Shared Packages Architecture

### 1.1. Dynamic gRPC Client Module (`@tomatocinema/common`)

The monorepo uses a custom `AbstractGrpcClient` and dynamic `GrpcModule` that automatically converts RxJS Observables into native TypeScript Promises:

`packages/common/src/lib/grpc/grpc.module.ts`:

- Registers gRPC clients dynamically (`AUTH_PACKAGE`, `ACCOUNT_PACKAGE`, `USERS_PACKAGE`).
- Injects clients via `@InjectGrpcClient(PACKAGE_NAME)`.
- Translates gRPC RPC status codes into standard internal representations (`RpcStatus` enum).

### 1.2. Passport & Cryptography Package (`@tomatocinema/passport`)

Handles secure token generation, verification, and HTTP guard integration:

- Base64URL encoding/decoding utilities (`lib/utils/base64.ts`).
- Cryptographic hash helpers (`lib/utils/crypto.ts`).
- `PassportModule.registerAsync()`: Injects secret, audience, and token expiration configurations.
- `PassportService`: Signs Access Tokens (short-lived) and Refresh Tokens (long-lived).

---

## 2. API Gateway Service (`apps/gateway-service`)

The Gateway is the unified entrypoint for clients, running on port 3000. It routes HTTP requests to internal gRPC microservices.

### 2.1. Gateway Bootstrap (`src/main.ts`)

```typescript
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./core/app.module";
import { getCorsconfig, getValidationPipeConfig } from "./core/config";
import { GrpcExceptionFilter } from "./shared/filters";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.enableCors(getCorsconfig(config));
  app.useGlobalPipes(new ValidationPipe(getValidationPipeConfig()));
  app.useGlobalFilters(new GrpcExceptionFilter());

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Tomato Cinema API")
    .setDescription("Tài liệu API Gateway cho hệ sinh thái Tomato Cinema")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = config.get("port") || 3000;
  await app.listen(port);
  Logger.log(`🚀 API Gateway is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
```

### 2.2. Distributed Roles Guard (`src/shared/guards/roles.guard.ts`)

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleUser } from "@tomatocinema/contracts/gen/account";
import { AccountClientGrpc } from "../../modules/account/account.grpc";
import { ROLES_KEY } from "../decorators";

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly accountClient: AccountClientGrpc,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RoleUser[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException("Thiếu ngữ cảnh người dùng");

    // gRPC call to Auth/Account service for fresh role check
    const account = await this.accountClient.call("getAccount", {
      id: user.id,
    });
    if (!account) throw new NotFoundException("Tài khoản không tìm thấy");

    if (!required.includes(account.role)) {
      throw new ForbiddenException(
        "Bạn không có quyền truy cập tài nguyên này",
      );
    }

    return true;
  }
}
```

### 2.3. Composite `@Protected()` Decorator (`src/shared/decorators/protected.decorator.ts`)

Combines JWT authentication guard (`JwtAuthGuard`), custom roles guard (`RolesGuard`), metadata reflection, and Swagger Bearer Auth tags in a single decorator:

```typescript
export function Protected(...roles: RoleUser[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: "Chưa đăng nhập" }),
    ApiForbiddenResponse({ description: "Không đủ quyền truy cập" }),
  );
}
```

### 2.4. Account Controller (`src/modules/account/account.controller.ts`)

Handles 2-step verification for changing email and phone numbers:

- `POST /api/v1/account/email/init`: Initiates email change, sends verification code to new email.
- `POST /api/v1/account/email/confirm`: Validates OTP and updates account record.
- `POST /api/v1/account/phone/init`: Initiates phone change, sends SMS code.
- `POST /api/v1/account/phone/confirm`: Validates OTP and updates phone record.

---

## 3. Auth Microservice (`apps/auth-service`)

Runs gRPC server on port 50051 and HTTP metrics server on port 9101. Manages identity, passwordless OTP, Telegram SSO, and tokens.

### 3.1. Auth Service Core Implementation (`src/modules/auth/auth.service.ts`)

- **`sendOtp(request: SendOtpRequest)`**:
  1. Checks Redis throttle key (`otp_throttle:<identifier>`).
  2. Generates a secure random 6-digit number.
  3. Hashes code using SHA-256 and stores in Redis with 300s TTL.
  4. Publishes `auth.otp_requested` event via `MessagingService` to RabbitMQ.
- **`verifyOtp(request: VerifyOtpRequest)`**:
  1. Compares submitted OTP against Redis hash.
  2. Deletes OTP key upon match (single-use consumption).
  3. Finds or creates `Account` in PostgreSQL via Prisma.
  4. If new account, calls `UsersClientGrpc.createUser()` on User Service.
  5. Signs Access Token and Refresh Token via `PassportService`.
- **`refresh(request: RefreshRequest)`**:
  1. Validates Refresh Token signature.
  2. Checks user existence and status.
  3. Rotates tokens: generates new Access Token and new Refresh Token.

### 3.2. Account Repository (`src/modules/account/account.repository.ts`)

Prisma data access layer:

- `createAccountWithPhone()`, `createAccountWithEmail()`
- `findAccountById()`, `findAccountByEmail()`, `findAccountByPhone()`
- `upsertPendingContactChange()`: Manages pending OTP requests with composite unique constraint `@@unique([accountId, type])`.
- `confirmPendingContactChange()`: Transactionally updates account email/phone and deletes the pending record.

### 3.3. Asynchronous Messaging Service (`src/infrastructure/messaging/messaging.service.ts`)

Publishes AMQP messages to RabbitMQ exchange `auth.events` for decoupled background tasks:

```typescript
@Injectable()
export class MessagingService {
  public constructor(
    @Inject("RMQ_CLIENT") private readonly rmqClient: ClientProxy,
  ) {}

  public emitOtpRequested(payload: OtpRequestedEvent) {
    return this.rmqClient.emit("auth.otp_requested", payload);
  }
}
```

---

## 4. User Microservice (`apps/user-service`)

Runs gRPC server on port 50052. Manages profile details, user bios, and avatars:

### 4.1. Implementation Highlights

- **Framework:** NestJS Microservices with TypeORM on PostgreSQL (`users_db`).
- **Entity:** `UserEntity` with primary key `id: uuid` linked to `Account.id` in `auth_db`.
- **Handlers:**
  - `getMe({ id })`: Retrieves user profile by UUID.
  - `createUser({ id })`: Initializes an empty profile row when an account is registered.
  - `patchUser({ userId, name, avatar })`: Updates mutable profile attributes.

---

## 5. Notification Microservice (`apps/notification-service`)

Event-driven worker consuming RabbitMQ queue `notifications_queue`:

### 5.1. Implementation Highlights

- **Transport:** `Transport.RMQ` configured with durable queues.
- **Controller:** Listens for `@EventPattern('auth.otp_requested')`.
- **Mail Service (`MailService`):**
  - Configured with Nodemailer and Handlebars template engine.
  - Templates located at `src/infrastructure/mail/templates/`:
    - `otp.hbs`: OTP code delivery with branded HTML markup.
    - `password-reset.hbs`: Password reset token link.
    - `password-changed.hbs`: Security alert after password modification.
    - `email-changed.hbs`: Notification of email change.
- **SMS Service (`SmsService`):** Integrates Exolve SMS gateway for mobile OTP delivery.

---

## 6. Telegram Bot Service (`apps/bot-service`)

Provides Telegram SSO authentication for instant one-tap login:

- **Framework:** Telegraf v4.
- **Factory:** `createBot()` loads bot token and registers command handlers.
- **Start Handler (`start.handler.ts`):**
  - Parses deep-link parameter: `/start sess_<id>`.
  - Prompts user to send phone contact via Telegram keyboard button.
- **Contact Handler (`contact.handler.ts`):**
  - Extracts verified Telegram user info and shared phone number.
  - Calls `AuthServiceClient.telegramComplete({ sessionId, phone })` via gRPC.
  - Notifies user in chat that web login is approved.
