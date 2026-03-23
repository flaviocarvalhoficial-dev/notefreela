import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertCircle, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotInsightsProps {
    context: any;
    onAction?: (prompt: string) => void;
}

export const CopilotInsights = ({ context, onAction }: CopilotInsightsProps) => {
    const insights = [];

    // 1. PROJECT SPECIFIC INSIGHTS
    if (context.is_project_context && context.project) {
        const p = context.project;

        // Deadline Alert
        if (p.deadline) {
            const daysLeft = Math.ceil((new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft >= 0 && daysLeft <= 3 && p.status !== 'completed') {
                insights.push({
                    type: "risk",
                    title: "Prazo Crítico Detectado",
                    description: `A entrega de "${p.name}" é em ${daysLeft === 0 ? 'hoje' : daysLeft + ' dias'}. Você tem tarefas pendentes que precisam de foco.`,
                    action: "Quais as tarefas prioritárias para este projeto agora?",
                    actionLabel: "Priorizar Agora",
                    icon: AlertCircle,
                    color: "text-rose-500",
                    bg: "bg-rose-500/5"
                });
            }
        }

        // Completion Rate Alert
        const projectTasks = context.tasks || [];
        const completedCount = projectTasks.filter((t: any) => t.column_id === 'done').length;
        if (projectTasks.length > 0 && (completedCount / projectTasks.length) < 0.3 && p.status === 'active') {
            insights.push({
                type: "performance",
                title: "Produção Lenta",
                description: `Apenas ${Math.round((completedCount / projectTasks.length) * 100)}% das tarefas deste projeto foram concluídas. Recomendo acelerar a execução.`,
                action: "Como posso acelerar este projeto?",
                actionLabel: "Pedir Sugestão",
                icon: Zap,
                color: "text-amber-500",
                bg: "bg-amber-500/5"
            });
        }
    }

    // 2. GLOBAL OVERVIEW INSIGHTS (Fallbacks if no project context or fewer project insights)
    if (insights.length < 2 && context?.global_overview) {
        const g = context.global_overview;

        if (g.total_leads === 0) {
            insights.push({
                type: "risk",
                title: "Pipeline de Leads Vazio",
                description: "Você não tem novos leads. Sem novas oportunidades, seu faturamento pode cair nos próximos meses.",
                action: "/radar",
                actionLabel: "Ver Radar de Leads",
                icon: AlertCircle,
                color: "text-amber-500",
                bg: "bg-amber-500/5"
            });
        } else if (g.hot_leads_count > 0 && !context.is_project_context) {
            insights.push({
                type: "opportunity",
                title: `${g.hot_leads_count} Lead(s) Quente(s)`,
                description: "Há oportunidades de alto potencial prontas para fechamento. Vamos converter?",
                action: "/radar",
                actionLabel: "Atuar nos Leads",
                icon: Zap,
                color: "text-primary",
                bg: "bg-primary/5"
            });
        }

        if (g.tasks_total > 0 && (g.tasks_completed / g.tasks_total) < 0.2) {
            insights.push({
                type: "performance",
                title: "Baixa Taxa de Conclusão",
                description: "Apenas uma pequena parcela das tarefas globais foi concluída. Há riscos de atrasos.",
                action: "/proxima",
                actionLabel: "Priorizar Tarefas",
                icon: TrendingUp,
                color: "text-emerald-500",
                bg: "bg-emerald-500/5"
            });
        }
    }

    if (insights.length === 0) {
        insights.push({
            type: "status",
            title: "Operação Estável",
            description: "Tudo parece sob controle hoje. Quer que eu analise algo específico?",
            action: "/diagnostico",
            actionLabel: "Ver Diagnóstico Completo",
            icon: Sparkles,
            color: "text-primary",
            bg: "bg-primary/5"
        });
    }

    return (
        <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 px-1 mb-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Insights do Copiloto</span>
            </div>

            {insights.map((insight, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                        "p-4 rounded-2xl border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-all",
                        insight.bg
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-xl bg-background border border-border/40 shrink-0", insight.color)}>
                            <insight.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-[12px] font-bold text-foreground tracking-tight">{insight.title}</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed leading-snug">
                                {insight.description}
                            </p>
                            <button
                                onClick={() => onAction?.(insight.action)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-primary mt-2 group-hover:gap-2 transition-all uppercase tracking-wider"
                            >
                                {insight.actionLabel}
                                <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
