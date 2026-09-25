import type { ComponentPropsWithRef } from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = ComponentPropsWithRef<"button"> & {
  variant?: Variant;
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-sm border font-medium " +
  "disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<Variant, string> = {
  primary:
    "border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover",
  secondary:
    "border-line-strong bg-surface text-ink hover:bg-sunken",
  danger: "border-danger bg-danger text-white hover:bg-danger-hover hover:border-danger-hover",
};

const sizes = {
  sm: "h-7 px-2 text-[13px]",
  md: "h-9 px-3 text-sm",
};

export function Button({ variant = "secondary", size = "md", className = "", ...rest }: Props) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}
