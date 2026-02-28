import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { generateInstallments, BillingConfig } from "@/utils/billing";
import { useToast } from "@/hooks/use-toast";

export function useBillingSync(projectId: string) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const saveBillingMutation = useMutation({
        mutationFn: async (config: BillingConfig) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Generate new installments locally
            const installmentSeeds = generateInstallments(config);

            // 2. Clear old UNPAID installments
            const { error: deleteError } = await (supabase as any)
                .from("installments")
                .delete()
                .eq("project_id", projectId)
                .eq("status", "provisionado");

            if (deleteError) throw deleteError;

            // 3. Upsert Billing Agreement
            const { data: agreement, error: agreementError } = await (supabase as any)
                .from("billing_agreements")
                .upsert({
                    project_id: projectId,
                    user_id: user.id,
                    model: config.model,
                    trigger: config.trigger,
                    cycle: config.cycle,
                    months: config.months,
                    entry_amount: config.entryAmount || 0,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (agreementError) throw agreementError;

            // 4. Insert New Installments
            const installmentsToInsert = installmentSeeds.map(i => ({
                ...i,
                project_id: projectId,
                billing_agreement_id: agreement.id,
                user_id: user.id
            }));

            const { error: installmentError } = await (supabase as any)
                .from("installments")
                .insert(installmentsToInsert);

            if (installmentError) throw installmentError;

            return { agreement, installments: installmentsToInsert };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["finance_projects"] });
            queryClient.invalidateQueries({ queryKey: ["installments", projectId] });
            toast({ title: "Sincronização Financeira!", description: "Parcelas e acordos atualizados com sucesso." });
        },
        onError: (err: any) => {
            toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
        }
    });

    return { saveBillingMutation };
}
