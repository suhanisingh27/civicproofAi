import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";
const variants = cva("inline-flex items-center justify-center rounded-xl text-sm font-semibold transition active:scale-[.98] disabled:opacity-50", { variants: { variant: { default: "bg-blue-600 text-white shadow-lg shadow-blue-600/20", outline: "border border-slate-200 bg-white text-slate-700", ghost: "text-slate-600" }, size: { default: "h-11 px-4", sm: "h-9 px-3 text-xs", lg: "h-12 px-5" } }, defaultVariants: { variant: "default", size: "default" } });
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => { const Comp = asChild ? Slot : "button"; return <Comp className={cn(variants({ variant, size, className }))} ref={ref} {...props} />; });
Button.displayName = "Button";
