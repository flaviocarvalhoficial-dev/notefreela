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

export function useFinancialData(selectedMonth: string = "all") {
    // 1. Fetch Projects & Project Costs
    const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
        queryKey: ["finance_projects"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*, project_costs(*)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any;
        }
    });

    // 2. Fetch Tool Subscriptions
    const { data: subscriptions = [], isLoading: isLoadingSubs } = useQuery({
        queryKey: ["tool-subscriptions"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("tool_subscriptions")
                .select("*");

            if (error) {
                // Graceful fallback if table doesn't exist yet
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

        const today = new Date().toISOString().split('T')[0];

        // Calculate Project based income and costs
        projects.forEach(p => {
            const installments = p.project_costs?.filter(c => c.category === "receita_parcela") || [];

            // Advance payment is typically paid at creation (assume paid if date passed)
            const advanceDate = (p.created_at || "").split('T')[0];
            const advanceAmt = Number(p.advance_payment) || 0;

            const advanceReceived = advanceDate <= today ? advanceAmt : 0;
            const advanceProvisioned = advanceDate > today ? advanceAmt : 0;

            const installmentsReceived = installments
                .filter(c => c.date <= today)
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            const installmentsProvisioned = installments
                .filter(c => c.date > today)
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            const paidTotal = advanceReceived + installmentsReceived;
            const provisionedTotal = advanceProvisioned + installmentsProvisioned;

            // Costs (excluding installment income)
            const costsTotal = p.project_costs
                ?.filter(c => c.category !== "receita_parcela")
                .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            const projectMonth = (p.created_at || "").substring(0, 7);
            const deadlineMonth = (p.deadline || "").substring(0, 7);

            if (selectedMonth === "all") {
                totalIncome += paidTotal;
                // Provisioned is not added to income yet, but tracked separately
                totalRemaining += provisionedTotal + Math.max(0, (p.value || 0) - (paidTotal + provisionedTotal));
                totalProjectCosts += costsTotal;
            } else {
                // If filtering by month, show what was RECEIVED in that month
                if (isInSelectedMonth(advanceDate, selectedMonth)) {
                    totalIncome += advanceReceived;
                }
                installments.forEach(c => {
                    if (isInSelectedMonth(c.date, selectedMonth)) {
                        const validDate = toValidDate(c.date);
                        const validToday = toValidDate(today);
                        if (validDate && validToday) {
                            totalIncome += validDate <= validToday ? Number(c.amount) : 0;
                        }
                    }
                });

                if (isInSelectedMonth(p.created_at, selectedMonth)) {
                    totalProjectCosts += costsTotal;
                }

                if (isInSelectedMonth(p.deadline, selectedMonth)) {
                    totalRemaining += Math.max(0, (p.value || 0) - (paidTotal + provisionedTotal));
                }
            }
        });

        // Calculate Active Subscriptions (pro-rated to monthly)
        subscriptions.filter(s => s.status === 'active').forEach(sub => {
            // Simplified conversion (same as Assinaturas.tsx)
            const priceBRL = sub.currency === 'USD' ? sub.price * 6 : sub.price;
            const monthlyCost = sub.billing_cycle === 'anual' ? priceBRL / 12 : priceBRL;

            totalSubscriptionCosts += monthlyCost;
        });

        const totalCosts = totalProjectCosts + totalSubscriptionCosts;
        const netProfit = totalIncome - totalCosts;

        // NEW: Provisioned (installments scheduled for THE FUTURE) - Arthur Marques Sign
        let totalProvisioned = 0;
        const provisionedItems: { id: string; title: string; amount: number; date: string; type: 'parcela' | 'recorrente'; projectName: string }[] = [];

        projects.forEach(p => {
            // 1. Installments (Parcelas avulsas) - Only those in the future
            p.project_costs
                ?.filter(c => {
                    const isInstallment = c.category === "receita_parcela";
                    const isFuture = c.date > today;
                    const matchesMonth = isInSelectedMonth(c.date, selectedMonth);

                    if (isInstallment && isFuture && matchesMonth) {
                        if (!toValidDate(c.date)) {
                            console.warn("[Financeiro] Data de parcela inválida", { id: c.id, date: c.date, item: c });
                            return false;
                        }
                        return true;
                    }
                    return false;
                })
                .forEach(c => {
                    const amt = Number(c.amount) || 0;
                    totalProvisioned += amt;
                    provisionedItems.push({
                        id: c.id,
                        title: c.title,
                        amount: amt,
                        date: c.date,
                        type: 'parcela',
                        projectName: p.name
                    });
                });

            // 2. Recurring Projects (Assinaturas/Retainers)
            const billingConfig = (p.services as any[] || []).find(s => s.name === "__billing_config__");
            const condition = billingConfig?.condition || 'immediate';
            const timing = billingConfig?.timing || 'start';
            const paymentModel = billingConfig?.paymentModel || 'full';

            const isRecurringActive = p.billing_type === "recorrente" && p.contract_status === "active";
            const billingDateMatches = p.next_billing_date && isInSelectedMonth(p.next_billing_date, selectedMonth);
            const isFutureBilling = p.next_billing_date && p.next_billing_date > today;

            if (isRecurringActive && billingDateMatches && isFutureBilling) {
                const validBillingDate = toValidDate(p.next_billing_date);
                if (!validBillingDate) {
                    console.warn("[Financeiro] next_billing_date inválido", { id: p.id, next_billing_date: p.next_billing_date, project: p });
                    return; // Skip this project for recurring logic if date is broken
                }

                let shouldBill = true;
                if (condition === 'post_installments' && p.project_costs && p.project_costs.length > 0) {
                    const lastInstallmentDate = p.project_costs
                        .filter(c => c.category === "receita_parcela")
                        .reduce((max, c) => c.date > max ? c.date : max, "");
                    if (lastInstallmentDate && p.next_billing_date! <= lastInstallmentDate) {
                        shouldBill = false;
                    }
                }

                if (shouldBill) {
                    const totalValue = Number(p.value) || 0;

                    if (paymentModel === 'split') {
                        const halfAmt = totalValue / 2;

                        // 1. Entrance (First half)
                        totalProvisioned += halfAmt;
                        provisionedItems.push({
                            id: `recurring-ent-${p.id}`,
                            title: `Mensalidade (Entrada 50%)`,
                            amount: halfAmt,
                            date: p.next_billing_date!,
                            type: 'recorrente',
                            projectName: p.name
                        });

                        // 2. Remainder (Second half)
                        const d = toValidDate(p.next_billing_date! + 'T12:00:00');
                        if (d) {
                            const lastDayOfMonthDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                            const remainderDateISO = safeToISOString(lastDayOfMonthDate);

                            if (remainderDateISO) {
                                const remainderDate = remainderDateISO.split('T')[0];
                                // Only add second half if it matches the filter month or if all
                                if (selectedMonth === "all" || isInSelectedMonth(remainderDate, selectedMonth)) {
                                    totalProvisioned += halfAmt;
                                    provisionedItems.push({
                                        id: `recurring-rem-${p.id}`,
                                        title: `Mensalidade (Saldo 50%)`,
                                        amount: halfAmt,
                                        date: remainderDate,
                                        type: 'recorrente',
                                        projectName: p.name
                                    });
                                }
                            }
                        }
                    } else {
                        // Integral model
                        totalProvisioned += totalValue;
                        provisionedItems.push({
                            id: `recurring-${p.id}`,
                            title: `Faturamento Mensal (${timing === 'end' ? 'Postecipado' : 'Antecipado'})`,
                            amount: totalValue,
                            date: p.next_billing_date!,
                            type: 'recorrente',
                            projectName: p.name
                        });
                    }
                }
            }
        });

        return {
            totalIncome,
            totalRemaining,
            totalProvisioned,
            provisionedItems,
            totalProjectCosts,
            totalSubscriptionCosts,
            totalCosts,
            netProfit,
            projectCount: projects.length
        };
    })();

    return {
        projects,
        subscriptions,
        stats,
        isLoading: isLoadingProjects || isLoadingSubs
    };
}
