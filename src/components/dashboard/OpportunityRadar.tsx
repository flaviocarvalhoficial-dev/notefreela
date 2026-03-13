import { motion } from "framer-motion";
import {
    Zap,
    TrendingUp,
    ArrowUpRight,
    Users,
    Clock,
    Sparkles,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

import { useDashboardData } from "@/hooks/use-dashboard-data";

export const OpportunityRadar = () => {
    const navigate = useNavigate();
    const { leads } = useDashboardData();

    // Map real leads to opportunity view or use limited set for visibility
    const opportunities = leads.slice(0, 3).map(lead => ({
        id: lead.id,
        type: lead.is_hot ? "hot-lead" : (lead.source || "lead"),
        title: lead.name,
        description: lead.notes || `Oportunidade identificada via ${lead.source || 'Nimbus Capture'}.`,
        confidence: lead.score || 50,
        target: lead.company_name || lead.name
    }));

    if (opportunities.length === 0) {
        return (
            <div className="bg-card/30 backdrop-blur-sm border border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/40">
                    <Zap className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-widest mb-1">Radar Silencioso</h4>
                    <p className="text-[10px] text-muted-foreground max-w-[200px]">Nenhuma oportunidade detectada no momento. Continue prospectando via Nimbus Growth.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider mt-2 border-primary/20 hover:bg-primary/5"
                    onClick={() => navigate('/leads')}
                >
                    Explorar Leads
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded-full" />
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        Radar de Inteligência
                        <Sparkles className="h-3 w-3 text-primary/60" />
                    </h3>
                </div>
                <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase tracking-widest border-primary/10 bg-primary/5 text-primary/80 px-2 rounded-lg">
                    IA Ativa
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {opportunities.map((opp, i) => (
                    <motion.div
                        key={opp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="outline" className={cn(
                                    "px-1.5 py-0 h-4 text-[8px] font-bold uppercase tracking-widest border-none rounded-md",
                                    opp.type === 'hot-lead' ? "bg-rose-500/10 text-rose-500" :
                                        opp.type === 'upsell' ? "bg-emerald-500/10 text-emerald-500" :
                                            "bg-blue-500/10 text-blue-500"
                                )}>
                                    {opp.type}
                                </Badge>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-primary/70 tabular-nums">{opp.confidence}%</span>
                                    <span className="text-[8px] font-bold text-muted-foreground/30 uppercase">Score</span>
                                </div>
                            </div>
                            <h4 className="text-xs font-semibold text-foreground/90 mb-1.5 group-hover:text-primary transition-colors truncate">
                                {opp.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-4 font-medium">
                                {opp.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-auto">
                            <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest truncate max-w-[100px]">{opp.target}</span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg"
                                    onClick={() => navigate('/leads')}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm rounded-lg"
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
