import React from "react";
import { cn } from "@/lib/utils";

interface EyeClosedProps {
    className?: string;
}

export const EyeClosed = ({ className }: EyeClosedProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide lucide-eye-closed", className)}
    >
        <path d="M3 10c0 5 4 9 9 9s9-4 9-9" />
        <path d="M12 19v3" />
        <path d="M7 18l-1.5 2.5" />
        <path d="M16 18l1.5 2.5" />
    </svg>
);
