import * as React from "react";
import { useValueVisibility } from "@/hooks/use-value-visibility";
import { cn } from "@/lib/utils";

interface MaskableValueProps {
    value: React.ReactNode;
    className?: string;
    maskString?: string;
    showWhenHidden?: boolean;
}

export function MaskableValue({
    value,
    className,
    maskString = "••••••",
    showWhenHidden = false,
}: MaskableValueProps) {
    const { hideValues } = useValueVisibility();

    if (hideValues && !showWhenHidden) {
        return (
            <span className={cn("inline-flex items-center blur-[6px] select-none pointer-events-none opacity-50 transition-all duration-300", className)}>
                R$ {maskString}
            </span>
        );
    }

    return <span className={className}>{value}</span>;
}
