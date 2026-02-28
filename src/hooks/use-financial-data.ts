import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { toValidDate, safeToISOString, isInSelectedMonth } from "@/utils/date";

export interface Project {
    id: string;
    name: string;
    value: number;
    advance_payment: number;
    client_name: string;
    status: string;
    deadline: string | null;
    created_at: string;
    services?: { name: string; price: number }[];
    project_costs?: ProjectCost[];
    billing_type?: string;
    contract_status?: string;
    next_billing_date?: string;
}

export interface ProjectCost {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    project_id: string | null;
}

export interface Subscription {
    id: string;
    name: string;
    icon: string;
    price: number;
    currency: string;
    billing_cycle: string;
    next_payment_date: string;
    status: string;
    category: string;
}

export interface Installment {
    id: string;
    project_id: string;
    billing_agreement_id: string;
    due_date: string;
    amount: number;
    status: 'provisionado' | 'atrasado' | 'cancelado' | 'recebido';
    origin_label?: string;
}

export interface Transaction {
    id: string;
    project_id: string;
    installment_id?: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    description?: string;
}

export function useFinancialData(selectedMonth: string = "all") {
    // 1. Fetch data from all relevant tables
    const { data: rawData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ["finance_projects", selectedMonth],
        queryFn: async () => {
            const projectsPromise = supabase
                .from("projects")
                .select("*, project_costs(*)")
                .order("created_at", { ascending: false });

            // We use (supabase as any) to avoid type errors until the schema is officially refreshed
            const installmentsPromise = (supabase as any)
                .from("installments")
                .select("*");

            const transactionsPromise = (supabase as any)
                .from("transactions")
                .select("*");

            const agreementsPromise = (supabase as any)
                .from("billing_agreements")
                .select("*");

            const [pRes, iRes, tRes, aRes] = await Promise.all([
                projectsPromise,
                installmentsPromise,
                transactionsPromise,
                agreementsPromise
            ]);

            if (pRes.error) throw pRes.error;

            return {
                projects: (pRes.data as any[]),
                installments: (iRes.data || []) as Installment[],
                transactions: (tRes.data || []) as Transaction[],
                agreements: (aRes.data || []) as any[]
            };
        }
    });

    const { projects = [], installments = [], transactions = [], agreements = [] } = rawData || {};

    // 2. Fetch Tool Subscriptions
    const { data: subscriptions = [], isLoading: isLoadingSubs } = useQuery({
        queryKey: ["tool-subscriptions"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("tool_subscriptions")
                .select("*");

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            return data as Subscription[];
        }
    });

    // 3. Derived Business Logic
    const stats = (() => {
        let totalIncome = 0;
        let totalRemaining = 0;
        let totalProjectCosts = 0;
        let totalSubscriptionCosts = 0;
        let totalProvisioned = 0;
        const provisionedItems: any[] = [];
        const incomeItems: any[] = [];

        const today = new Date().toLocaleDateString('en-CA');

        projects.forEach(p => {
            const projectInstallments = installments.filter(i => i.project_id === p.id);
            const projectTransactions = transactions.filter(t => t.project_id === p.id);
            const projectAgreement = agreements.find(a => a.project_id === p.id);

            // Legacy check
            const legacyInstallments = p.project_costs?.filter(c => c.category === "receita_parcela") || [];
            const useNewModel = projectInstallments.length > 0 || projectAgreement;

            if (useNewModel) {
                // NEW MODEL LOGIC
                // Income is the sum of actual transactions
                projectTransactions.forEach(t => {
                    if (selectedMonth === "all" || isInSelectedMonth(t.payment_date, selectedMonth)) {
                        const amt = Number(t.amount);
                        if (amt > 0) {
                            totalIncome += amt;
                            incomeItems.push({
                                id: t.id,
                                title: t.description || 'Recebimento',
                                amount: amt,
                                date: t.payment_date,
                                type: projectAgreement?.cycle === 'mensal' ? 'recorrente' : 'setup',
                                projectName: p.name
                            });
                        }
                    }
                });

                // Provisions are unpaid or pending installments
                projectInstallments.forEach(inst => {
                    const isProvisioned = inst.status === 'provisionado' || inst.status === 'atrasado';
                    if (isProvisioned) {
                        // Fallback logic for legacy/zero-amount installments
                        let amt = Number(inst.amount) || 0;
                        if (amt === 0 && projectAgreement) {
                            const isMensalidade = projectAgreement.cycle === 'mensal' || inst.origin_label?.toLowerCase().includes('mensalidade');

                            if (isMensalidade) {
                                // Se é mensalidade, o valor de fallback é o valor cheio mensal
                                amt = Number(projectAgreement.monthly_amount) || Number(p.value) || 0;
                            } else {
                                // Se é setup/parcela, divide o total pelos meses
                                amt = Number(projectAgreement.monthly_amount) || (Number(p.value) / (projectAgreement.months || 1)) || 0;
                            }
                        }

                        if (isInSelectedMonth(inst.due_date, selectedMonth)) {
                            totalProvisioned += amt;
                            provisionedItems.push({
                                id: inst.id,
                                title: inst.origin_label || 'Parcela Agendada',
                                amount: amt,
                                date: inst.due_date,
                                type: projectAgreement?.cycle === 'mensal' || inst.origin_label?.toLowerCase().includes('mensalidade') ? 'recorrente' : 'parcela',
                                projectName: p.name
                            });
                        }
                        totalRemaining += amt;
                    }
                });
            } else {
                // LEGACY FALLBACK LOGIC
                const servicesArray = Array.isArray(p.services) ? p.services : [];
                const billingConfig = servicesArray.find((s: any) => s.name === "__billing_config__");
                const isEarlyPayment = billingConfig?.isEarlyPayment || false;
                const isProjectFullyPaid = p.payment_status === "paid" || isEarlyPayment;
                const isAdvancePaid = isProjectFullyPaid || p.payment_status === "partial";

                const advanceDate = (p.created_at || "").split('T')[0];
                const advanceAmt = Number(p.advance_payment) || 0;
                const isAdvanceFuture = advanceDate > today;

                const advanceReceived = (!isAdvanceFuture || isAdvancePaid) ? advanceAmt : 0;
                const advanceProvisioned = (isAdvanceFuture && !isAdvancePaid) ? advanceAmt : 0;

                const instReceived = legacyInstallments
                    .filter(c => c.date <= today || isProjectFullyPaid)
                    .reduce((acc, curr) => acc + Number(curr.amount), 0);

                const instProvisioned = legacyInstallments
                    .filter(c => (c.date > today && !isProjectFullyPaid))
                    .reduce((acc, curr) => acc + Number(curr.amount), 0);

                const alreadyPaid = advanceReceived + instReceived;

                if (selectedMonth === "all") {
                    totalIncome += alreadyPaid;
                    totalRemaining += (p.value || 0) - alreadyPaid;
                } else {
                    if (isInSelectedMonth(advanceDate, selectedMonth)) totalIncome += advanceReceived;
                    legacyInstallments.forEach(c => {
                        if (isInSelectedMonth(c.date, selectedMonth) && (c.date <= today || isProjectFullyPaid)) {
                            totalIncome += Number(c.amount);
                        }
                    });
                }

                // Provision legacy items
                if (advanceProvisioned > 0 && isInSelectedMonth(advanceDate, selectedMonth)) {
                    totalProvisioned += advanceAmt;
                    provisionedItems.push({ id: `adv-${p.id}`, title: "Aporte Inicial", amount: advanceAmt, date: advanceDate, type: 'parcela', projectName: p.name });
                }
                legacyInstallments.forEach(c => {
                    if (c.date > today && !isProjectFullyPaid && isInSelectedMonth(c.date, selectedMonth)) {
                        totalProvisioned += Number(c.amount);
                        provisionedItems.push({ id: c.id, title: c.title, amount: c.amount, date: c.date, type: 'parcela', projectName: p.name });
                    }
                });
            }

            // SHARED COSTS LOGIC (Always from project_costs until separated)
            const costsTotal = p.project_costs
                ?.filter(c => c.category !== "receita_parcela")
                .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            if (selectedMonth === "all") {
                totalProjectCosts += costsTotal;
            } else if (isInSelectedMonth(p.created_at, selectedMonth)) {
                totalProjectCosts += costsTotal;
            }
        });

        // 2. Active Subscriptions
        subscriptions.filter(s => s.status === 'active').forEach(sub => {
            const priceBRL = sub.currency === 'USD' ? sub.price * 6.12 : sub.price;
            const monthlyCost = sub.billing_cycle === 'anual' ? priceBRL / 12 : priceBRL;
            totalSubscriptionCosts += monthlyCost;
        });

        const totalCosts = totalProjectCosts + totalSubscriptionCosts;
        const netProfit = totalIncome - totalCosts;

        return {
            totalIncome,
            totalRemaining,
            totalProvisioned,
            provisionedItems,
            incomeItems,
            totalProjectCosts,
            totalSubscriptionCosts,
            totalCosts,
            netProfit,
            projectCount: projects.length
        };
    })();

    const projectsWithFinancialData = projects.map(p => ({
        ...p,
        installments: installments.filter(i => i.project_id === p.id),
        transactions: transactions.filter(t => t.project_id === p.id),
        agreement: agreements.find(a => a.project_id === p.id)
    }));

    return {
        projects: projectsWithFinancialData,
        subscriptions,
        stats,
        isLoading: isLoadingProjects || isLoadingSubs
    };
}
