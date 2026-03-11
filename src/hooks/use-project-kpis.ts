import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UseProjectKpisProps {
    projectId: string;
    project: any;
    tasks: any[];
    inboxItems: any[];
    costs: any[];
    installments: any[];
}

export function useProjectKpis({
    projectId,
    project,
    tasks,
    inboxItems,
    costs,
    installments
}: UseProjectKpisProps) {
    return useMemo(() => {
        const nextDeadline = project?.deadline ? format(new Date(project.deadline), "dd/MM/yy", { locale: ptBR }) : null;
        const now = new Date();
        const currentMonth = format(now, "yyyy-MM");

        const projectInstallments = (installments as any[]).filter(inst => inst.project_id === projectId);
        const projectCosts = (costs as any[]).filter(c => c.project_id === projectId);

        const pendingInstallments = projectInstallments
            .filter(i => (i.status === 'provisionado' || i.status === 'atrasado') && (i.due_date || "").startsWith(currentMonth))
            .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

        const pendingManual = projectCosts
            .filter(c => (c.category === 'revenue' || c.category === 'receita_parcela') && (c.date || "").startsWith(currentMonth) && c.date > now.toISOString().split('T')[0])
            .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

        const financialBalance = pendingInstallments + pendingManual;

        return {
            openTasks: tasks.filter((t: any) => t.status !== 'done').length,
            pendingInbox: inboxItems.length,
            financialBalance,
            nextDeadline
        };
    }, [project, tasks, inboxItems, costs, installments, projectId]);
}
