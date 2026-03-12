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
                .select("name, status, description, value, deadline")
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

    return {
        path: location.pathname,
        project: project ? {
            name: project.name,
            status: project.status,
            description: project.description,
            value: project.value,
            deadline: project.deadline
        } : null,
        tasks: tasks || [],
        page_context: location.search
    };
}
