import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export type Lead = {
    id: string;
    created_at: string;
    user_id: string;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    status: 'novo' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';
    source: string | null;
    notes: string | null;
    score: number;
    potential_value: number | null;
    is_hot: boolean;
};

const MOCK_LEADS: Lead[] = [
    {
        id: "L1",
        created_at: new Date().toISOString(),
        user_id: "mock",
        name: "João Silva",
        company_name: "Tech Flow",
        email: "joao@techflow.com",
        phone: "11999999999",
        website: "techflow.com",
        status: "novo",
        source: "Google Maps",
        notes: "Interessado em novo site",
        score: 85,
        potential_value: 5000,
        is_hot: true
    },
    {
        id: "L2",
        created_at: new Date().toISOString(),
        user_id: "mock",
        name: "Maria Oliveira",
        company_name: "Studio Arte",
        email: "maria@studioarte.com",
        phone: "11888888888",
        website: "studioarte.com",
        status: "contato",
        source: "Indicação",
        notes: "Rebranding completo",
        score: 92,
        potential_value: 12000,
        is_hot: true
    }
];

export const useLeads = () => {
    const queryClient = useQueryClient();

    const { data: leads = [], isLoading, error } = useQuery({
        queryKey: ["leads"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("leads")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error) {
                    if (error.code === '42P01') {
                        console.warn("Table leads does not exist, using mock data");
                        return MOCK_LEADS;
                    }
                    throw error;
                }
                return data as Lead[];
            } catch (err) {
                console.error("Leads query failed:", err);
                return MOCK_LEADS;
            }
        },
    });

    const createLeadMutation = useMutation({
        mutationFn: async (newLead: { name: string } & Partial<Lead>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await (supabase as any)
                .from("leads")
                .insert([{
                    ...newLead,
                    user_id: user.id,
                    status: newLead.status || 'novo',
                    score: newLead.score || 0,
                    is_hot: newLead.is_hot || false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    const updateLeadMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("leads")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    const deleteLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from("leads").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    const convertToClientMutation = useMutation({
        mutationFn: async (lead: Lead) => {
            // 1. Insert into clients
            const { data: client, error: clientError } = await (supabase as any)
                .from("clients")
                .insert({
                    name: lead.name,
                    company_name: lead.company_name,
                    email: lead.email,
                    phone: lead.phone,
                    user_id: lead.user_id,
                })
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Delete from leads (only if it's not a mock lead)
            if (!lead.id.startsWith('L')) {
                const { error: deleteError } = await (supabase as any)
                    .from("leads")
                    .delete()
                    .eq("id", lead.id);

                if (deleteError) throw deleteError;
            }

            return client;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["clients-raw"] });
        },
    });

    return {
        leads,
        isLoading,
        error,
        createLead: createLeadMutation.mutateAsync,
        updateLead: updateLeadMutation.mutateAsync,
        deleteLead: deleteLeadMutation.mutateAsync,
        convertToClient: convertToClientMutation.mutateAsync,
        isCreating: createLeadMutation.isPending,
        isUpdating: updateLeadMutation.isPending,
        isDeleting: deleteLeadMutation.isPending,
        isConverting: convertToClientMutation.isPending,
    };
};
