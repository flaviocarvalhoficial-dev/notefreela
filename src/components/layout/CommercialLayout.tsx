import { Outlet } from "react-router-dom";
import { CommercialTabs } from "@/components/shared/CommercialTabs";
import { Sparkles } from "lucide-react";

export const CommercialLayout = () => {
    return (
        <div className="page-container relative overflow-hidden h-screen flex flex-col">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.015] dark:opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="flex items-center justify-between gap-4 mb-8 h-12 relative z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        Gestão Comercial <Sparkles className="h-5 w-5 text-primary opacity-50" />
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Pipeline de Vendas & Crescimento</p>
                </div>
            </header>

            <CommercialTabs />

            <main className="flex-1 min-h-0 overflow-hidden relative z-10">
                <Outlet />
            </main>
        </div>
    );
};
