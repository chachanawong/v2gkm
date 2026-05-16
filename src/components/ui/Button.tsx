import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  tooltip?: string;
};

export function Button({ children, icon, variant = "primary", size = "md", tooltip, className = "", ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} title={tooltip} {...props}>
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
