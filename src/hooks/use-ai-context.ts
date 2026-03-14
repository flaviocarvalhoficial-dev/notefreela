import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export function useAIContext() {
    const location = useLocation();
    const { id: projectId } = useParams();

    // Try to find if we are in a project context
    const projectMatch = location.pathname.match(/\/projetos\/([^\/?#]+)/);
    const activeProjectId = projectId || (projectMatch ? projectMatch[1] : null);

    // Fetch project details if active
    const { data: project } = useQuery({
        queryKey: ["ai-context-project", activeProjectId],
        queryFn: async () => {
            if (!activeProjectId || activeProjectId === "novo") return null;
            const { data, error } = await supabase
                .from("projects")
                .select("name, status, description, value, deadline, client_name")
                .eq("id", activeProjectId)
                .single();
            if (error) return null;
            return data;
        },
        enabled: !!activeProjectId && activeProjectId !== "novo",
    });

    // Fetch tasks if in project
    const { data: tasks } = useQuery({
        queryKey: ["ai-context-tasks", activeProjectId],
        queryFn: async () => {
            if (!activeProjectId || activeProjectId === "novo") return [];
            const { data, error } = await supabase
                .from("tasks")
                .select("title, column_id, priority, progress")
                .eq("project_id", activeProjectId);
            if (error) return [];
            return data;
        },
        enabled: !!activeProjectId && activeProjectId !== "novo",
    });

    // Fetch Global Metrics for general context
    const { data: globalMetrics } = useQuery({
        queryKey: ["ai-global-metrics"],
        queryFn: async () => {
            const [projectsRes, leadsRes, clientsRes, tasksRes] = await Promise.all([
                supabase.from("projects").select("id, status, value, client_name, created_at, billing_type"),
                supabase.from("leads").select("id, name, company_name, status, potential_value, is_hot"),
                supabase.from("clients").select("id, name"),
                supabase.from("tasks").select("id, column_id, priority")
            ]);

            const totalValue = projectsRes.data?.reduce((acc, p) => acc + (Number(p.value) || 0), 0) || 0;

            // Billing by month (simplified grouping)
            const billingByMonth: Record<string, number> = {};
            projectsRes.data?.forEach(p => {
                const date = new Date(p.created_at);
                const month = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                billingByMonth[month] = (billingByMonth[month] || 0) + (Number(p.value) || 0);
            });

            // Leads Funnel
            const leadsFunnel = {
                novo: leadsRes.data?.filter(l => l.status === 'novo').length || 0,
                contato: leadsRes.data?.filter(l => l.status === 'contato').length || 0,
                proposta: leadsRes.data?.filter(l => l.status === 'proposta').length || 0,
                negociacao: leadsRes.data?.filter(l => l.status === 'negociacao').length || 0,
                fechado: leadsRes.data?.filter(l => l.status === 'fechado').length || 0,
                perdido: leadsRes.data?.filter(l => l.status === 'perdido').length || 0,
            };

            const pendingValue = leadsRes.data
                ?.filter(l => ['proposta', 'negociacao'].includes(l.status))
                .reduce((acc, l) => acc + (Number(l.potential_value) || 0), 0) || 0;

            const taskPriority = {
                high: tasksRes.data?.filter(t => t.priority === 'high').length || 0,
                medium: tasksRes.data?.filter(t => t.priority === 'medium').length || 0,
                low: tasksRes.data?.filter(t => t.priority === 'low').length || 0,
            };

            return {
                total_projects: projectsRes.data?.length || 0,
                active_projects: projectsRes.data?.filter(p => p.status !== 'completed').length || 0,
                total_leads: leadsRes.data?.length || 0,
                total_clients: clientsRes.data?.length || 0,
                total_project_value: totalValue,
                pending_proposals_value: pendingValue,
                average_ticket: projectsRes.data?.length ? (totalValue / projectsRes.data.length) : 0,
                tasks_completed: tasksRes.data?.filter(t => t.column_id === 'done').length || 0,
                tasks_total: tasksRes.data?.length || 0,
                task_priority_summary: taskPriority,
                leads_funnel: leadsFunnel,
                hot_leads_count: leadsRes.data?.filter(l => l.is_hot).length || 0,
                billing_by_month: billingByMonth,
                recent_leads: leadsRes.data?.slice(0, 3).map(l => `${l.name} (${l.company_name})`) || [],
                updated_at: new Date().toISOString()
            };
        },
        initialData: {
            total_projects: 0,
            active_projects: 0,
            total_leads: 0,
            total_clients: 0,
            total_project_value: 0,
            pending_proposals_value: 0,
            average_ticket: 0,
            tasks_completed: 0,
            tasks_total: 0,
            task_priority_summary: { high: 0, medium: 0, low: 0 },
            leads_funnel: { novo: 0, contato: 0, proposta: 0, negociacao: 0, fechado: 0, perdido: 0 },
            hot_leads_count: 0,
            billing_by_month: {},
            recent_leads: [],
            updated_at: new Date().toISOString()
        }
    });

    // Fetch User Profile
    const { data: profile } = useQuery({
        queryKey: ["ai-user-profile"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            const { data, error } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();
            if (error) return null;
            return data;
        }
    });

    return {
        path: location.pathname,
        user_name: profile?.full_name || "Freelancer",
        is_project_context: !!activeProjectId && activeProjectId !== "novo",
        project: project ? {
            name: project.name,
            status: project.status,
            description: project.description,
            value: project.value,
            deadline: project.deadline,
            client: project.client_name
        } : null,
        tasks: tasks || [],
        global_overview: globalMetrics || null,
        page_context: location.search
    };
}
