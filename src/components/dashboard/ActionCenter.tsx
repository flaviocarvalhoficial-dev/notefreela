import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
    AlertCircle,
    Calendar,
    MessageSquare,
    DollarSign,
    ArrowRight,
    LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ActionItem {
    id: string;
    type: 'deadline' | 'lead' | 'payment';
    title: string;
    subtitle: string;
    date?: string;
    priority: 'high' | 'medium';
    icon: LucideIcon;
    link: string;
}

export function ActionCenter() {
    const { projects, leads, isLoading } = useDashboardData();
    const navigate = useNavigate();

    if (isLoading) return null;

    const today = startOfDay(new Date());
    const criticalThreshold = addDays(today, 2);

    const actions: ActionItem[] = [];

    // 1. Critical Deadlines
    projects.forEach(p => {
        if (p.deadline && p.status !== 'completed') {
            const deadlineDate = new Date(p.deadline);
            if (isBefore(deadlineDate, criticalThreshold)) {
                actions.push({
                    id: `deadline-${p.id}`,
                    type: 'deadline',
                    title: p.name,
                    subtitle: isBefore(deadlineDate, today) ? "Atrasado!" : `Entrega em ${format(deadlineDate, "dd 'de' MMM", { locale: ptBR })}`,
                    date: p.deadline,
                    priority: isBefore(deadlineDate, today) ? 'high' : 'medium',
                    icon: Calendar,
                    link: `/projetos/${p.id}`
                });
            }
        }
    });

    // 2. Leads Needing Follow-up
    leads.forEach(l => {
        const createdDate = new Date(l.created_at);
        const daysOld = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        if (['novo', 'contato'].includes(l.status) && daysOld >= 2) {
            actions.push({
                id: `lead-${l.id}`,
                type: 'lead',
                title: l.company_name || l.name,
                subtitle: `Aguardando contato há ${daysOld} dias`,
                priority: daysOld >= 4 ? 'high' : 'medium',
                icon: MessageSquare,
                link: '/leads'
            });
        }
    });

    // 3. Pending Payments (from installments join in projects)
    projects.forEach(p => {
        const installments = (p as any).installments;
        if (Array.isArray(installments)) {
            installments.forEach((inst: any) => {
                if (inst.status === 'pending' && inst.due_date) {
                    const dueDate = new Date(inst.due_date);
                    if (isBefore(dueDate, criticalThreshold)) {
                        actions.push({
                            id: `payment-${inst.id}`,
                            type: 'payment',
                            title: `Parcela: ${p.name}`,
                            subtitle: isBefore(dueDate, today) ? "Pagamento Atrasado" : `Vence em ${format(dueDate, "dd/MM")}`,
                            priority: isBefore(dueDate, today) ? 'high' : 'medium',
                            icon: DollarSign,
                            link: `/projetos/${p.id}`
                        });
                    }
                }
            });
        }
    });

    // Sort by priority and then date
    const sortedActions = actions.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return 0;
    }).slice(0, 3); // Top 3 critical items

    if (sortedActions.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Ações Prioritárias</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sortedActions.map((action, i) => (
                    <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(action.link)}
                        className={cn(
                            "group relative overflow-hidden bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-transparent hover:border-amber-500/20 cursor-pointer transition-all",
                            action.priority === 'high' ? "ring-1 ring-amber-500/10 bg-amber-500/[0.02]" : ""
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "p-2 rounded-xl shrink-0",
                                action.priority === 'high' ? "bg-amber-500/10 text-amber-600" : "bg-muted/30 text-muted-foreground"
                            )}>
                                <action.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {action.title}
                                </h4>
                                <p className={cn(
                                    "text-[11px] font-medium pt-0.5",
                                    action.priority === 'high' ? "text-amber-600" : "text-muted-foreground/70"
                                )}>
                                    {action.subtitle}
                                </p>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
