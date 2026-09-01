import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function IconArchitecture({
  className = "w-5 h-5",
  size = 20,
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );
}

export function IconPackage({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

export function IconDatabase({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}

export function IconWorkflow({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

export function IconApi({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

export function IconShield({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

export function IconTelegram({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export function IconRabbitMQ({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2a4 4 0 00-4 4v3.2A6.98 6.98 0 004 15c0 3.86 3.14 7 7 7s7-3.14 7-7c0-2.38-1.19-4.47-3-5.74V6a4 4 0 00-4-4zm0 2c1.1 0 2 .9 2 2v2H10V6c0-1.1.9-2 2-2zm-1 8h2v2h-2v-2zm-3 3h2v2H8v-2zm6 0h2v2h-2v-2z" />
    </svg>
  );
}

export function IconCopy({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

export function IconCheck({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function IconExternalLink({
  className = "w-3.5 h-3.5",
  size = 14,
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export function IconTerminal({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export function IconChevronRight({
  className = "w-4 h-4",
  size = 16,
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconSearch({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function IconBook({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export function IconMenu({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

export function IconClose({ className = "w-5 h-5", size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
