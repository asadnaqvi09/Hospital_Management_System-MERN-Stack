import { cn } from "@/utils/cn"
export function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  disabled,
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700",
    secondary: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-700 hover:bg-slate-100"
  }
  const sizes = {
    sm: "h-9 px-3",
    md: "h-10 px-4",
    lg: "h-11 px-5"
  }
  return (
    <Comp
      className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </Comp>
  )
}
export default Button
