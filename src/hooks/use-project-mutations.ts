import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

interface CreateTaskParams {
    title: string;
    project_id: string;
    priority: string;
    due_date?: string;
    assignee?: string;
    column_id?: string;
}

export function useProjectMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createTaskMutation = useMutation({
        mutationFn: async (values: CreateTaskParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    title: values.title,
                    project_id: values.project_id,
                    priority: values.priority as any,
                    due_date: values.due_date,
                    assignee: values.assignee,
                    user_id: user.id,
                    column_id: (values.column_id || "todo") as any,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["tasks-stats"] });
            queryClient.invalidateQueries({ queryKey: ["project-tasks", variables.project_id] });
            toast({ title: "Sucesso!", description: "Tarefa criada com sucesso." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", projectId);
            if (error) throw error;
            return projectId;
        },
        onSuccess: (projectId) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            queryClient.invalidateQueries({ queryKey: ["sidebar-projects"] });
            toast({ title: "Projeto excluído", description: "O projeto foi removido com sucesso." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        },
    });

    const updateProjectIconMutation = useMutation({
        mutationFn: async ({ id, icon }: { id: string; icon: string }) => {
            const { error } = await supabase
                .from("projects")
                .update({ avatar_emoji: icon })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: "Ícone atualizado" });
        }
    });

    return {
        createTask: createTaskMutation.mutate,
        createTaskAsync: createTaskMutation.mutateAsync,
        isCreatingTask: createTaskMutation.isPending,

        deleteProject: deleteProjectMutation.mutate,
        deleteProjectAsync: deleteProjectMutation.mutateAsync,
        isDeletingProject: deleteProjectMutation.isPending,

        updateIcon: updateProjectIconMutation.mutate,
        updateProject: (updates: Partial<Tables<"projects">> & { id: string }) => {
            const { id, ...rest } = updates;
            return supabase.from("projects").update(rest).eq("id", id).then(({ error }) => {
                if (error) throw error;
                queryClient.invalidateQueries({ queryKey: ["project", id] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
                toast({ title: "Atualizado" });
            });
        }
    };
}
