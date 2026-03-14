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

            // 1. Create the search record
            const { data: search, error: searchError } = await (supabase as any)
                .from("growth_searches")
                .insert([{ query, location, radius, user_id: user.id }])
                .select()
                .single();

            if (searchError) throw searchError;

            // 2. Here we would call the Google Maps / Scraper API
            // For now, we simulate with mock results that get inserted into the DB
            const mockResults = [
                {
                    search_id: search.id,
                    name: `${query} ${location}`,
                    address: `Rua Principal, ${location}`,
                    website: "www.exemplo.com.br",
                    phone: "(11) 99999-9999",
                    rating: 4.5,
                    reviews_count: 120,
                    needs: ["Sem Site Mobile", "Baixa Presença Digital"],
                    score: 85,
                    status: 'pending'
                },
                {
                    search_id: search.id,
                    name: `${query} Central`,
                    address: `Av. Central, ${location}`,
                    website: null,
                    phone: "(11) 88888-8888",
                    rating: 4.0,
                    reviews_count: 50,
                    needs: ["Sem Site", "Sem Google My Business"],
                    score: 90,
                    status: 'pending'
                }
            ];

            const { data: results, error: resultsError } = await (supabase as any)
                .from("growth_results")
                .insert(mockResults)
                .select();

            if (resultsError) throw resultsError;

            // Update result count
            await (supabase as any)
                .from("growth_searches")
                .update({ results_count: results.length })
                .eq("id", search.id);

            return { search, results };
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
