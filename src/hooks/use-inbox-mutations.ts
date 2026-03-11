import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activities";

interface CreateInboxParams {
    title?: string;
    content: string;
    type?: string;
    project_id?: string | null;
}

export function useInboxMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createInboxMutation = useMutation({
        mutationFn: async (values: CreateInboxParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth error");

            const { data, error } = await supabase.from("inbox").insert({
                title: values.title || values.content?.substring(0, 30),
                content: values.content,
                type: values.type || 'note',
                project_id: values.project_id || null,
                user_id: user.id
            }).select().single();

            if (error) throw error;

            await logActivity({
                title: `Captura criada: ${data.title} `,
                description: `Conteúdo: ${data.content?.substring(0, 50)}...`,
                type: "inbox",
                projectId: data.project_id || undefined,
                metadata: { inbox_id: data.id }
            });

            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            if (data.project_id) {
                queryClient.invalidateQueries({ queryKey: ["project-inbox", data.project_id] });
            }
            toast({ title: "Captura realizada" });
        }
    });

    const convertInboxToTaskMutation = useMutation({
        mutationFn: async ({ item, project_id }: { item: any; project_id: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: cols } = await supabase
                .from("kanban_columns")
                .select("id")
                .eq("project_id", project_id)
                .order("position", { ascending: true })
                .limit(1);

            const columnId = cols?.[0]?.id || 'todo';

            const { error: taskErr } = await supabase.from("tasks").insert({
                project_id: project_id,
                user_id: user.id,
                title: item.title || "Captura convertida",
                column_id: columnId as any,
                progress: 0,
                priority: "medium",
                created_at: new Date().toISOString()
            });

            if (taskErr) throw taskErr;

            await logActivity({
                title: `Captura convertida: ${item.title || "Captura convertida"} `,
                description: `Item movido da Inbox para as tarefas`,
                type: "task",
                projectId: project_id,
                metadata: { inbox_id: item.id }
            });

            const { error: delErr } = await supabase.from("inbox").delete().eq("id", item.id);
            if (delErr) throw delErr;

            return { project_id };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            queryClient.invalidateQueries({ queryKey: ["project-inbox", data.project_id] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["project-tasks", data.project_id] });
            toast({ title: "Convertido em tarefa!", description: "O item foi movido para a lista de tarefas." });
        }
    });

    const deleteInboxMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("inbox").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({ title: "Excluído da Inbox" });
        }
    });

    return {
        createCapture: createInboxMutation.mutate,
        createCaptureAsync: createInboxMutation.mutateAsync,
        isCapturing: createInboxMutation.isPending,

        convertInboxToTask: convertInboxToTaskMutation.mutate,
        isConverting: convertInboxToTaskMutation.isPending,

        deleteInbox: deleteInboxMutation.mutate,
    };
}
