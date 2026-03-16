import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sparkles, Users, FileText, Briefcase } from "lucide-react";

const tabs = [
    { id: "growth", label: "Growth", icon: Sparkles, path: "/comercial/growth" },
    { id: "leads", label: "Leads", icon: Users, path: "/comercial/leads" },
    { id: "propostas", label: "Propostas", icon: FileText, path: "/comercial/propostas" },
    { id: "clientes", label: "Clientes", icon: Briefcase, path: "/comercial/clientes" },
];

export const CommercialTabs = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="flex items-center bg-muted/20 p-1 rounded-xl w-fit mb-8 relative z-10">
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                            isActive
                                ? "bg-card text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Icon className={cn("h-3.5 w-3.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground/60")} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
