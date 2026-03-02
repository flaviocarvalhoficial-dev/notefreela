import * as React from "react";
import { ValueVisibilityProvider as InternalProvider } from "@/hooks/use-value-visibility";

export function ValueVisibilityProvider({ children }: { children: React.ReactNode }) {
    return <InternalProvider>{children}</InternalProvider>;
}
