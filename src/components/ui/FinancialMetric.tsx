import React from "react";
import { cn } from "@/lib/utils";

interface FinancialMetricProps {
    label: string;
    value: string | number;
    prefix?: string;
    suffix?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
    trend?: "up" | "down" | "neutral";
    isCurrency?: boolean;
}

const FinancialMetric = ({
    label,
    value,
    prefix,
    suffix,
    className,
    size = "md",
    trend,
    isCurrency = true,
}: FinancialMetricProps) => {
    const formattedValue = typeof value === "number" && isCurrency
        ? new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
        : value;

    const sizeStyles = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-lg px-4 py-2",
    };

    const trendStyles = {
        up: "text-emerald-600 dark:text-emerald-500",
        down: "text-rose-600 dark:text-rose-500",
        neutral: "text-muted-foreground",
    };

    return (
        <div className={cn(
            "flex flex-col gap-0.5",
            className
        )}>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80">
                {label}
            </span>
            <div className="flex items-baseline gap-1">
                {prefix && <span className="text-[0.8em] opacity-60">{prefix}</span>}
                <span className={cn(
                    "font-semibold tracking-tight text-foreground",
                    trend && trendStyles[trend],
                    size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm"
                )}>
                    {formattedValue}
                </span>
                {suffix && <span className="text-[0.7em] opacity-60 ml-0.5">{suffix}</span>}
            </div>
        </div>
    );
};

export default FinancialMetric;
