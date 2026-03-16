import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-1.5 py-0 h-5 text-[10px] font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
        outline: "text-foreground border-border/60 bg-transparent",
        tonal: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        success: "border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
        warning: "border-transparent bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
