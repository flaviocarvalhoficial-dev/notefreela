import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export type ProposalStatus = 'aberta' | 'aceita' | 'recusada' | 'expirada';

export type Proposal = {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    client_id: string | null;
    lead_id: string | null;
    title: string;
    client_name: string | null;
    value: number;
    status: ProposalStatus;
    version: string;
    content: string | null;
    valid_until: string | null;
    metadata: any;
};

export const useProposals = () => {
    const queryClient = useQueryClient();

    const { data: proposals = [], isLoading, error } = useQuery({
        queryKey: ["proposals"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("proposals")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any as Proposal[];
        },
    });

    const createProposalMutation = useMutation({
        mutationFn: async (newProposal: Partial<Proposal>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await (supabase as any)
                .from("proposals")
                .insert([{ ...newProposal, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proposals"] });
        },
    });

    const updateProposalMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Proposal> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("proposals")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proposals"] });
        },
    });

    const deleteProposalMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from("proposals").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proposals"] });
        },
    });

    return {
        proposals,
        isLoading,
        error,
        createProposal: createProposalMutation.mutateAsync,
        updateProposal: updateProposalMutation.mutateAsync,
        deleteProposal: deleteProposalMutation.mutateAsync,
        isCreating: createProposalMutation.isPending,
        isUpdating: updateProposalMutation.isPending,
        isDeleting: deleteProposalMutation.isPending
    };
};
