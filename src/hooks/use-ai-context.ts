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
                supabase.from("projects").select("id, status, value, client_name"),
                supabase.from("leads").select("id, name, company_name, status"),
                supabase.from("clients").select("id, name"),
                supabase.from("tasks").select("id, column_id")
            ]);

            const totalValue = projectsRes.data?.reduce((acc, p) => acc + (Number(p.value) || 0), 0) || 0;

            return {
                total_projects: projectsRes.data?.length || 0,
                active_projects: projectsRes.data?.filter(p => p.status !== 'completed').length || 0,
                total_leads: leadsRes.data?.length || 0,
                total_clients: clientsRes.data?.length || 0,
                total_project_value: totalValue,
                average_ticket: projectsRes.data?.length ? (totalValue / projectsRes.data.length) : 0,
                tasks_completed: tasksRes.data?.filter(t => t.column_id === 'done').length || 0,
                tasks_total: tasksRes.data?.length || 0,
                recent_leads: leadsRes.data?.slice(0, 3).map(l => `${l.name} (${l.company_name})`) || []
            };
        }
    });

    return {
        path: location.pathname,
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
