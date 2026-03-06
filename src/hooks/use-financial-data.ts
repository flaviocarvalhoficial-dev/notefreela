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

    const stats = (() => {
        let totalIncome = 0;
        let totalRemaining = 0;
        let totalProjectCosts = 0;
        let totalSubscriptionCosts = 0;
        let totalProvisioned = 0;
        const provisionedItems: any[] = [];
        const incomeItems: any[] = [];

        // Stable date comparison
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

        projects.forEach(p => {
            const projectInstallments = installments.filter(i => i.project_id === p.id);
            const projectTransactions = transactions.filter(t => t.project_id === p.id);
            const projectAgreement = agreements.find(a => a.project_id === p.id);
            const legacyInstallments = p.project_costs?.filter(c => c.category === "receita_parcela") || [];

            // 1. Transactions (Always count as income)
            projectTransactions.forEach(t => {
                const linkedInstallment = projectInstallments.find(i => i.id === t.installment_id);
                // Use installment due_date for reporting if linked, otherwise literal payment_date
                // This allows pre-payments (Feb) to count in project month (March)
                const reportingDate = linkedInstallment?.due_date || t.payment_date;

                if (selectedMonth === "all" || isInSelectedMonth(reportingDate, selectedMonth)) {
                    const amt = Number(t.amount);
                    if (amt > 0) {
                        totalIncome += amt;
                        incomeItems.push({
                            id: t.id,
                            title: t.description || 'Recebimento',
                            amount: amt,
                            date: reportingDate,
                            type: projectAgreement?.cycle === 'mensal' ? 'recorrente' : 'setup',
                            projectName: p.name
                        });
                    }
                }
            });

            // 1.5 Handle 'recebido' installments without transactions
            // This ensures manual "ticks" in UI reflect in total income automatically
            const strictlyPaidInstallments = projectInstallments.filter(i => i.status === 'recebido');
            strictlyPaidInstallments.forEach(inst => {
                // Robust matching: Check ID OR (description match + same month/amount)
                const hasTransaction = projectTransactions.some(t =>
                    t.installment_id === inst.id ||
                    (t.amount === inst.amount && t.description?.includes(inst.origin_label || ''))
                );
                if (!hasTransaction && (selectedMonth === "all" || isInSelectedMonth(inst.due_date, selectedMonth))) {
                    const amt = Number(inst.amount) || 0;
                    if (amt > 0) {
                        totalIncome += amt;
                        incomeItems.push({
                            id: inst.id,
                            title: inst.origin_label || 'Parcela Recebida (Manual)',
                            amount: amt,
                            date: inst.due_date,
                            type: projectAgreement?.cycle === 'mensal' || inst.origin_label?.toLowerCase().includes('mensalidade') ? 'recorrente' : 'setup',
                            projectName: p.name
                        });
                    }
                }
            });

            // 2. Physical Installments (New Table)
            // Filter out 'cancelado' and 'recebido' (recebido is handled by transactions)
            const activeInstallments = projectInstallments.filter(i => i.status === 'provisionado' || i.status === 'atrasado');

            activeInstallments.forEach(inst => {
                let amt = Number(inst.amount) || 0;
                if (amt === 0 && projectAgreement) {
                    const isMensalidade = projectAgreement.cycle === 'mensal' || inst.origin_label?.toLowerCase().includes('mensalidade');
                    amt = isMensalidade ? (Number(projectAgreement.monthly_amount) || Number(p.value) || 0) : ((Number(p.value) / (projectAgreement.months || 1)) || 0);
                }

                if (selectedMonth === "all" || isInSelectedMonth(inst.due_date, selectedMonth)) {
                    totalProvisioned += amt;
                    provisionedItems.push({
                        id: inst.id,
                        title: inst.origin_label || 'Parcela Agendada',
                        amount: amt,
                        date: inst.due_date,
                        type: projectAgreement?.cycle === 'mensal' || inst.origin_label?.toLowerCase().includes('mensalidade') ? 'recorrente' : 'parcela',
                        projectName: p.name
                    });
                    totalRemaining += amt;
                }
            });

            // 3. Fallback: Legacy Items
            // Use legacy if NO physical installments exist for this project (or if it's a known legacy project)
            const hasNewInstallmentSystem = projectInstallments.length > 0;

            if (!hasNewInstallmentSystem) {
                const isProjectFullyPaid = p.payment_status === "paid";

                // Advanced Payment
                const advanceDate = (p.created_at || "").split('T')[0];
                const advanceAmt = Number(p.advance_payment) || 0;
                const hasAdvanceLog = projectTransactions.length > 0; // Heuristic

                if (advanceAmt > 0 && !hasAdvanceLog) {
                    const isSettled = p.payment_status === 'paid' || p.payment_status === 'partial' || (advanceDate <= today && advanceDate !== "");
                    if (isSettled) {
                        if (selectedMonth === "all" || isInSelectedMonth(advanceDate, selectedMonth)) {
                            totalIncome += advanceAmt;
                            incomeItems.push({ id: `legacy-adv-inc-${p.id}`, title: "Sinal (Legado)", amount: advanceAmt, date: advanceDate, type: 'setup', projectName: p.name });
                        }
                    } else if (selectedMonth === "all" || isInSelectedMonth(advanceDate, selectedMonth)) {
                        totalProvisioned += advanceAmt;
                        provisionedItems.push({ id: `legacy-adv-prov-${p.id}`, title: "Sinal Agendado (Legado)", amount: advanceAmt, date: advanceDate, type: 'parcela', projectName: p.name });
                        totalRemaining += advanceAmt;
                    }
                }

                // Project Costs (Legacy Income Parcells)
                legacyInstallments.forEach(c => {
                    const amt = Number(c.amount);
                    if (isProjectFullyPaid || c.date <= today) {
                        if (selectedMonth === "all" || isInSelectedMonth(c.date, selectedMonth)) {
                            totalIncome += amt;
                            incomeItems.push({ id: `legacy-c-inc-${c.id}`, title: c.title, amount: amt, date: c.date, type: 'setup', projectName: p.name });
                        }
                    } else if (selectedMonth === "all" || isInSelectedMonth(c.date, selectedMonth)) {
                        totalProvisioned += amt;
                        provisionedItems.push({ id: `legacy-c-prov-${c.id}`, title: c.title, amount: amt, date: c.date, type: 'parcela', projectName: p.name });
                        totalRemaining += amt;
                    }
                });
            }

            // 4. Virtual Fallback: Recurring Projects
            // If recurring is active but no physical installments exist yet to track it
            const isRec = p.billing_type === "recorrente" && p.contract_status !== "expired";
            if (isRec) {
                const servicesArray = Array.isArray(p.services) ? p.services : [];
                const config = servicesArray.find((s: any) => s.name === "__billing_config__");

                let amt = Number(projectAgreement?.monthly_amount) || Number(p.value) || 0;
                let curDateStr = projectAgreement?.next_billing_date || p.next_billing_date || p.deadline || p.created_at;
                const duration = projectAgreement?.months || config?.contractDuration || 12;

                const hasPhysicalRec = projectInstallments.some(i => (i.origin_label?.toLowerCase().includes('mensalidade') || i.billing_agreement_id));
                const monthTransactions = new Set(projectTransactions.map(t => t.payment_date.substring(0, 7)));

                if (!hasPhysicalRec && amt > 0) {
                    for (let i = 0; i < duration; i++) {
                        if (!curDateStr) break;
                        const dateOnly = curDateStr.split('T')[0];
                        const mon = dateOnly.substring(0, 7);

                        // Only project if it's in the future AND not paid
                        if (dateOnly > today && !monthTransactions.has(mon)) {
                            if (selectedMonth === "all" || isInSelectedMonth(dateOnly, selectedMonth)) {
                                totalProvisioned += amt;
                                provisionedItems.push({
                                    id: `virtual-rec-${p.id}-${i}`,
                                    title: `Mensalidade Projetada (${i + 1}/${duration})`,
                                    amount: amt,
                                    date: dateOnly,
                                    type: 'recorrente',
                                    projectName: p.name
                                });
                                totalRemaining += amt;
                            }
                        }

                        const nextDateObj = toValidDate(dateOnly + 'T12:00:00');
                        if (nextDateObj) {
                            nextDateObj.setMonth(nextDateObj.getMonth() + 1);
                            curDateStr = safeToISOString(nextDateObj)?.split('T')[0] || null;
                        } else { break; }
                    }
                }
            }

            // 5. Shared Project Costs - Arthur Marques Sign
            // We sum costs that BELONG to this month specifically
            const monthlyCosts = p.project_costs
                ?.filter(c => c.category !== "receita_parcela")
                .filter(c => selectedMonth === "all" || isInSelectedMonth(c.date || p.created_at, selectedMonth))
                .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            totalProjectCosts += monthlyCosts;
        });

        // 6. Subscriptions
        subscriptions.filter(s => s.status === 'active').forEach(sub => {
            const priceBRL = sub.currency === 'USD' ? sub.price * 6.12 : sub.price;
            const monthlyCost = sub.billing_cycle === 'anual' ? priceBRL / 12 : priceBRL;
            totalSubscriptionCosts += monthlyCost;
        });

        const totalCosts = totalProjectCosts + totalSubscriptionCosts;
        const netProfit = totalIncome - totalCosts;

        provisionedItems.sort((a, b) => a.date.localeCompare(b.date));
        incomeItems.sort((a, b) => b.date.localeCompare(a.date));

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
