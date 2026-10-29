import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass"
  size?: "default" | "sm" | "lg" | "icon" | "xl"
}

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_-3px_var(--color-primary)] active:scale-95 transition-all",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_-3px_var(--color-destructive)] active:scale-95 transition-all",
  outline: "border-2 border-primary text-primary hover:bg-primary/10 active:scale-95 transition-all",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-all",
  ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all",
  link: "text-primary underline-offset-4 hover:underline active:scale-95 transition-all",
  glass: "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white active:scale-95 transition-all",
}

const sizes = {
  default: "h-11 px-6 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-14 rounded-xl px-8 text-lg font-semibold",
  xl: "h-20 rounded-2xl px-10 text-xl font-bold",
  icon: "h-12 w-12",
}

const buttonBase =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: Pick<ButtonProps, "variant" | "size" | "className"> = {}) {
  return cn(buttonBase, variants[variant], sizes[size], className)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
