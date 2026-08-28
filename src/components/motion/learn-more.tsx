import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Chevron() {
  return (
    <span className="t-learn-chevron" aria-hidden>
      <svg viewBox="0 0 16 16" fill="none">
        <path
          className="t-learn-arm t-learn-arm-top"
          d="M6 4L10 8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          className="t-learn-arm t-learn-arm-bot"
          d="M10 8L6 12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

type LearnMoreProps = {
  children: ReactNode;
  className?: string;
  to?: LinkProps["to"];
  href?: string;
  onClick?: () => void;
  as?: "button" | "span";
};

export function LearnMore({
  children,
  className,
  to,
  href,
  onClick,
  as,
}: LearnMoreProps) {
  const cls = cn("t-learn", className);
  const inner = (
    <>
      {children}
      <Chevron />
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  if (as === "span") {
    return <span className={cls}>{inner}</span>;
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
