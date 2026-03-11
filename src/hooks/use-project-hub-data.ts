import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export function useProjectHubData(id: string | undefined) {
    const { data: project, isLoading: isProjectLoading } = useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id as string)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ["project-tasks", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("project_id", id as string)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: inboxItems = [] } = useQuery({
        queryKey: ["project-inbox", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inbox")
                .select("*")
                .eq("project_id", id as string);
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: documents = [] } = useQuery({
        queryKey: ["project-documents", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("project_documents")
                .select("*")
                .eq("project_id", id as string);
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: costs = [] } = useQuery({
        queryKey: ["project-costs", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_costs")
                .select("*")
                .eq("project_id", id as string);
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: installments = [] } = useQuery({
        queryKey: ["project-installments", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("installments")
                .select("*")
                .eq("project_id", id as string);
            if (error) return [];
            return (data || []) as any[];
        },
        enabled: !!id,
    });

    const { data: activities = [] } = useQuery({
        queryKey: ["project-activities", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("activities")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(40);

            if (error) throw error;

            return data?.filter((a: any) =>
                a.metadata?.project_id === id ||
                (project?.name && a.title?.toLowerCase().includes(project.name.toLowerCase()))
            ) || [];
        },
        enabled: !!id && !!project,
    });

    const { data: clientData } = useQuery({
        queryKey: ["clients", project?.client_id],
        queryFn: async () => {
            if (!project?.client_id) return null;
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .eq("id", project.client_id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!project?.client_id
    });

    return {
        project,
        isLoading: isProjectLoading,
        tasks,
        inboxItems,
        documents,
        costs,
        installments,
        activities,
        clientData
    };
}
