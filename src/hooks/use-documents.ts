import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Document {
    id: string;
    title: string;
    category: string;
    lastModified: string;
    size: string;
    type: string;
    url: string;
    projectName: string;
    projectId: string;
}

export function useDocuments() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 1. Fetch de Projetos (para o Select no upload)
    const { data: projects = [] } = useQuery({
        queryKey: ["projects-simple"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("id, name")
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    // 2. Fetch de Documentos
    const { data: documents = [] as Document[], isLoading } = useQuery({
        queryKey: ["documents-all"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("project_documents")
                .select(`
                    *,
                    projects (
                        name
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data.map(doc => ({
                id: doc.id,
                title: doc.name,
                category: doc.category,
                lastModified: formatDistanceToNow(parseISO(doc.created_at), { addSuffix: true, locale: ptBR }),
                size: "N/A", // Poderia ser salvo no banco se necessário
                type: doc.file_url.split('.').pop()?.toUpperCase() || "FILE",
                url: doc.file_url,
                projectName: doc.projects?.name || "Geral",
                projectId: doc.project_id
            }));
        },
    });

    // 3. Mutação para Upload
    const uploadMutation = useMutation({
        mutationFn: async ({ file, name, category, projectId }: { file: File, name: string, category: string, projectId: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload para o bucket 'documents' (Crie este bucket se não existir)
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 3. Salvar no banco
            const { error: dbError } = await supabase
                .from('project_documents')
                .insert({
                    name: name,
                    category: category,
                    file_url: publicUrl,
                    project_id: projectId,
                    user_id: user.id
                });

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents-all"] });
            toast({ title: "Sucesso!", description: "Documento enviado com sucesso." });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro no envio",
                description: error.message || "Verifique se o bucket 'documents' existe no Supabase.",
                variant: "destructive"
            });
        }
    });

    // 4. Mutação para Deletar
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("project_documents")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents-all"] });
            toast({ title: "Documento excluído" });
        }
    });

    // 5. Mutação para Renomear
    const renameMutation = useMutation({
        mutationFn: async ({ id, name }: { id: string, name: string }) => {
            const { error } = await supabase
                .from("project_documents")
                .update({ name })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents-all"] });
            toast({ title: "Documento renomeado" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao renomear",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    return {
        documents: documents as Document[],
        projects,
        isLoading,
        upload: uploadMutation.mutate,
        isUploading: uploadMutation.isPending,
        delete: deleteMutation.mutate,
        rename: renameMutation.mutate
    };
}
