import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export type FormType = 'lead' | 'briefing' | 'feedback' | 'custom';
export type FormStatus = 'ativo' | 'arquivado';

export type NimbusForm = {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    title: string;
    description: string | null;
    type: FormType;
    status: FormStatus;
    fields: any[];
    settings: any;
    response_count: number;
    last_response_at: string | null;
};

export const useForms = () => {
    const queryClient = useQueryClient();

    const { data: forms = [], isLoading, error } = useQuery({
        queryKey: ["forms"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("forms")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any as NimbusForm[];
        },
    });

    const createFormMutation = useMutation({
        mutationFn: async (newForm: Partial<NimbusForm>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await (supabase as any)
                .from("forms")
                .insert([{ ...newForm, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forms"] });
        },
    });

    const updateFormMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<NimbusForm> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("forms")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forms"] });
        },
    });

    const deleteFormMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from("forms").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forms"] });
        },
    });

    return {
        forms,
        isLoading,
        error,
        createForm: createFormMutation.mutateAsync,
        updateForm: updateFormMutation.mutateAsync,
        deleteForm: deleteFormMutation.mutateAsync,
        isCreating: createFormMutation.isPending,
        isUpdating: updateFormMutation.isPending,
        isDeleting: deleteFormMutation.isPending
    };
};
