import { motion } from "framer-motion";
import {
    Zap,
    TrendingUp,
    ArrowUpRight,
    Users,
    Clock,
    Sparkles,
    MessageSquare,
    CheckSquare,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/shared/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export const OpportunityRadar = () => {
    const navigate = useNavigate();
    const { leads } = useDashboardData();

    // Map real leads to opportunity view or use limited set for visibility
    const opportunities = leads.slice(0, 4).map(lead => ({
        id: lead.id,
        type: lead.is_hot ? "hot-lead" : (lead.source || "insight"),
        title: lead.name,
        description: lead.notes || `Oportunidade identificada via ${lead.source || 'Nimbus Growth'}.`,
        confidence: lead.score || 50,
        target: lead.company_name || lead.name
    }));

    if (opportunities.length === 0) {
        return (
            <div className="h-full flex flex-col bg-card/30 backdrop-blur-sm rounded-2xl p-8 min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-primary/40" />
                        <h3 className="text-[11px] font-medium text-muted-foreground/60">Radar de Inteligência</h3>
                        <Badge variant="outline" className="text-[8px] h-4 font-medium px-2 rounded-full border-none bg-primary/5 text-primary/60 ml-2">
                            IA Ativa
                        </Badge>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon={Zap}
                        title="Radar Silencioso"
                        description="Nenhuma oportunidade detectada no momento. Continue prospectando via Nimbus Growth."
                        actionLabel="EXPLORAR LEADS"
                        onAction={() => navigate('/leads')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-primary/40" />
                    <h3 className="text-[11px] font-medium text-muted-foreground/60">Radar de Inteligência</h3>
                    <Badge variant="outline" className="text-[8px] h-4 font-medium px-2 rounded-full border-none bg-primary/5 text-primary/60 ml-2">
                        IA Ativa
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/leads')}
                    className="h-7 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                    Ver todos
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opp, i) => (
                    <motion.div
                        key={opp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-card/40 backdrop-blur-sm rounded-2xl p-5 hover:bg-card transition-all duration-300 flex flex-col justify-between shadow-sm"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="outline" className={cn(
                                    "px-2 h-4 text-[8px] font-medium border-none rounded-full",
                                    opp.type === 'hot-lead' ? "bg-rose-500/10 text-rose-500" :
                                        opp.type === 'upsell' ? "bg-emerald-500/10 text-emerald-500" :
                                            "bg-primary/10 text-primary"
                                )}>
                                    {opp.type === 'hot-lead' ? 'Hot Lead' : 'Insight Comercial'}
                                </Badge>
                                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold text-foreground tabular-nums">{opp.confidence}%</span>
                                    <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Score</span>
                                </div>
                            </div>
                            <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                                {opp.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2 mb-4">
                                {opp.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[140px] opacity-30">{opp.target}</span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                    onClick={() => navigate('/leads')}
                                >
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
