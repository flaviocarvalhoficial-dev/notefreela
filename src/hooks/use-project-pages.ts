import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

export function useProjectPages(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: pages = [], isLoading } = useQuery({
        queryKey: ["project-pages", projectId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("project_pages")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });

    const createPageMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth required");

            const { data, error } = await (supabase as any).from("project_pages").insert({
                project_id: projectId,
                user_id: user.id,
                title: "Nova Página",
                content_blocks: []
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-pages", projectId] });
            toast({ title: "Página criada" });
        }
    });

    const deletePageMutation = useMutation({
        mutationFn: async (pageId: string) => {
            const { error } = await (supabase as any)
                .from("project_pages")
                .delete()
                .eq("id", pageId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-pages", projectId] });
            toast({ title: "Página excluída" });
        }
    });

    const updatePageTitleMutation = useMutation({
        mutationFn: async ({ pageId, title }: { pageId: string; title: string }) => {
            const { error } = await (supabase as any)
                .from("project_pages")
                .update({ title })
                .eq("id", pageId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-pages", projectId] });
        }
    });

    const updateContentMutation = useMutation({
        mutationFn: async ({ pageId, contentBlocks }: { pageId: string | null; contentBlocks: any }) => {
            if (pageId) {
                const { error } = await (supabase as any)
                    .from("project_pages")
                    .update({ content_blocks: contentBlocks })
                    .eq("id", pageId);
                if (error) throw error;
            } else {
                const { error } = await (supabase as any)
                    .from("projects")
                    .update({ content_blocks: contentBlocks })
                    .eq("id", projectId);
                if (error) throw error;
            }
        },
        onSuccess: (_, variables) => {
            if (variables.pageId) {
                queryClient.invalidateQueries({ queryKey: ["project-pages", projectId] });
            } else {
                queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            }
        }
    });

    return {
        pages,
        isLoading,
        createPage: createPageMutation.mutateAsync,
        deletePage: deletePageMutation.mutate,
        updatePageTitle: updatePageTitleMutation.mutate,
        updateContent: updateContentMutation.mutate,
    };
}
