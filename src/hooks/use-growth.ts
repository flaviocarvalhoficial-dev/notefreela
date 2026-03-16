import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export type GrowthResult = {
    id: string;
    created_at: string;
    search_id: string;
    name: string;
    address: string | null;
    website: string | null;
    phone: string | null;
    rating: number | null;
    reviews_count: number | null;
    needs: string[];
    score: number;
    instagram: string | null;
    facebook: string | null;
    linkedin: string | null;
    status: 'pending' | 'converted' | 'ignored';
};

export type GrowthSearch = {
    id: string;
    created_at: string;
    user_id: string;
    query: string;
    location: string;
    radius: string;
    results_count: number;
};

export const useGrowth = () => {
    const queryClient = useQueryClient();

    const { data: recentSearches = [], isLoading: isLoadingSearches } = useQuery({
        queryKey: ["growth-searches"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("growth_searches")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(5);

            if (error) throw error;
            return data as GrowthSearch[];
        },
    });

    const runSearchMutation = useMutation({
        mutationFn: async ({ query, location, radius }: { query: string, location: string, radius: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Criar o registro da busca
            const { data: search, error: searchError } = await (supabase as any)
                .from("growth_searches")
                .insert([{ query, location, radius, user_id: user.id }])
                .select()
                .single();

            if (searchError) throw searchError;

            // 2. Chamar a Edge Function de mineração
            const { data, error: functionError } = await supabase.functions.invoke("lead-miner", {
                body: { query, location, radius, searchId: search.id }
            });

            if (functionError) throw functionError;

            return { search, results: data.results as GrowthResult[] };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["growth-searches"] });
        }
    });

    const updateResultStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: 'converted' | 'ignored' }) => {
            const { error } = await (supabase as any)
                .from("growth_results")
                .update({ status })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            // Refetch current results or invalidate searches
        }
    });

    return {
        recentSearches,
        isLoadingSearches,
        runSearch: runSearchMutation.mutateAsync,
        isSearching: runSearchMutation.isPending,
        updateStatus: updateResultStatusMutation.mutateAsync
    };
};
