import Link from "next/link";
import {
  Film,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Search,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-4 py-16 md:py-24 text-center overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 dark:bg-rose-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm backdrop-blur-sm">
        <Film className="h-3.5 w-3.5" />
        <span>Tomato Cinema Documentation Hub</span>
        <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl mb-6 text-foreground leading-[1.15]">
        Kiến trúc Microservices &amp; Quy trình Kỹ thuật{" "}
        <span className="bg-gradient-to-r from-rose-500 to-red-600 bg-clip-text text-transparent">
          Tomato Cinema
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
        Trung tâm tài liệu toàn diện: Phân tách rõ ràng giữa{" "}
        <strong>Luồng lớn (Macro)</strong> về kiến trúc hệ thống và{" "}
        <strong>Luồng nhỏ (Micro)</strong> về giải pháp kỹ thuật chuyên sâu.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 active:scale-95 cursor-pointer"
        >
          <BookOpen className="h-4 w-4" />
          <span>Bắt đầu đọc Tài liệu</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/docs/02-architecture-macro/system-overview"
          className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border border-border/80 bg-card/60 hover:bg-accent text-foreground hover:text-rose-500 rounded-xl transition-all duration-200 shadow-sm backdrop-blur-sm cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-rose-500" />
          <span>Sơ đồ Kiến trúc Tương tác</span>
        </Link>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-16 p-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="p-3 text-center">
          <div className="text-2xl font-black text-rose-500">6+</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Microservices
          </div>
        </div>
        <div className="p-3 text-center border-l border-border/40">
          <div className="text-2xl font-black text-rose-500">100%</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            SSG Tĩnh siêu tốc
          </div>
        </div>
        <div className="p-3 text-center border-l border-border/40">
          <div className="text-2xl font-black text-rose-500">Showcase</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Archify Diagrams
          </div>
        </div>
        <div className="p-3 text-center border-l border-border/40">
          <div className="text-2xl font-black text-rose-500">Orama</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Tìm kiếm Offline (Ctrl+K)
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
        <div className="group p-6 border border-border/70 rounded-2xl bg-card hover:border-rose-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-4 group-hover:scale-110 transition-transform duration-200">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold mb-2 text-foreground">
            Luồng lớn (Macro Flows)
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Khám phá toàn bộ kiến trúc phân tán, vòng đời xác thực Dual-Token,
            hành trình đặt vé từ A-Z và pipeline phát trực tuyến video HLS.
          </p>
        </div>

        <div className="group p-6 border border-border/70 rounded-2xl bg-card hover:border-rose-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-4 group-hover:scale-110 transition-transform duration-200">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold mb-2 text-foreground">
            Luồng nhỏ (Micro Flows)
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Giải quyết các bài toán kỹ thuật chuyên sâu: Redis Distributed Lock
            chống đặt trùng ghế, Token Rotation ngăn chặn xâm nhập và Multipart
            Chunked Upload.
          </p>
        </div>

        <div className="group p-6 border border-border/70 rounded-2xl bg-card hover:border-rose-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-4 group-hover:scale-110 transition-transform duration-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold mb-2 text-foreground">
            Sơ đồ Tương tác Archify
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Các sơ đồ được chuẩn hóa theo chuẩn Archify với khả năng phóng
            to/thu nhỏ, phân tích hành trình, hỗ trợ Light/Dark mode và xuất
            file SVG/PNG.
          </p>
        </div>
      </div>
    </div>
  );
}
