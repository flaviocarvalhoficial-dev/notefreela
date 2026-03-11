import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export function useClientMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const updateClientMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tables<"clients">> }) => {
            const { error } = await supabase
                .from("clients")
                .update(updates)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
            toast({ title: "Cliente atualizado" });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        },
    });

    return {
        updateClient: updateClientMutation.mutate,
        isUpdatingClient: updateClientMutation.isPending,
    };
}
