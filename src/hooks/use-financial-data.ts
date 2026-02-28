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
    billing_type?: string; // Added for recurring projects
    contract_status?: string; // Added for recurring projects
    next_billing_date?: string; // Added for recurring projects
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

        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time

        // NEW: Provisioned (installments scheduled for THE FUTURE) - Arthur Marques Sign
        let totalProvisioned = 0;
        const provisionedItems: { id: string; title: string; amount: number; date: string; type: 'parcela' | 'recorrente'; projectName: string }[] = [];

        // Calculate Project based income and costs
        projects.forEach(p => {
            // NEW: Status based logic (Early Payments / Quitado) - Arthur Marques Sign
            const servicesArray = Array.isArray(p.services) ? p.services : [];
            const billingConfig = servicesArray.find((s: any) => s.name === "__billing_config__");
            const isEarlyPayment = billingConfig?.isEarlyPayment || false;
            const isProjectFullyPaid = p.payment_status === "paid" || isEarlyPayment;
            const isAdvancePaid = isProjectFullyPaid || p.payment_status === "partial";

            const installments = p.project_costs?.filter(c => c.category === "receita_parcela") || [];
            const advanceDate = (p.created_at || "").split('T')[0];
            const advanceAmt = Number(p.advance_payment) || 0;
            const isAdvanceFuture = advanceDate > today;

            const advanceReceived = (!isAdvanceFuture || isAdvancePaid) ? advanceAmt : 0;
            const advanceProvisioned = (isAdvanceFuture && !isAdvancePaid) ? advanceAmt : 0;

            const installmentsReceived = installments
                .filter(c => c.date <= today || isProjectFullyPaid)
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            const installmentsProvisioned = installments
                .filter(c => (c.date > today && !isProjectFullyPaid))
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            const alreadyPaid = advanceReceived + installmentsReceived;
            const futureScheduled = advanceProvisioned + installmentsProvisioned;
            const residualValue = Math.max(0, (p.value || 0) - (alreadyPaid + futureScheduled));

            // 1. Provision Advance (if future AND not paid)
            if (advanceProvisioned > 0 && isInSelectedMonth(advanceDate, selectedMonth)) {
                totalProvisioned += advanceAmt;
                provisionedItems.push({
                    id: `adv-${p.id}`,
                    title: "Aporte Inicial / Adiantamento",
                    amount: advanceAmt,
                    date: advanceDate,
                    type: 'parcela',
                    projectName: p.name
                });
            }

            // 2. Provision Installments (if future AND not paid)
            installments.forEach(c => {
                const isInstallmentFuture = c.date > today;
                if (isInstallmentFuture && !isProjectFullyPaid) {
                    const amt = Number(c.amount) || 0;

                    // Logic: If installment is day 01-10 and deadline is exactly the previous month, it belongs to that month (Competence)
                    let targetMonth = c.date.substring(0, 7);
                    const day = parseInt(c.date.split('-')[2]);
                    if (day <= 10 && p.deadline) {
                        const dDate = toValidDate(p.deadline);
                        const cDate = toValidDate(c.date);
                        if (dDate && cDate) {
                            const prevMonthDate = new Date(cDate.getFullYear(), cDate.getMonth() - 1, 1);
                            const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);
                            const deadlineMonthStr = dDate.toISOString().substring(0, 7);

                            if (prevMonthStr === deadlineMonthStr) {
                                targetMonth = prevMonthStr;
                            }
                        }
                    }

                    if (isInSelectedMonth(targetMonth, selectedMonth)) {
                        totalProvisioned += amt;
                        provisionedItems.push({
                            id: c.id,
                            title: c.title + (targetMonth !== c.date.substring(0, 7) ? " (Competência Mês Anterior)" : ""),
                            amount: amt,
                            date: c.date,
                            type: 'parcela',
                            projectName: p.name
                        });
                    }
                }
            });

            // 3. Provision Residual (ONLY on deadline month)
            if (residualValue > 0 && p.deadline && isInSelectedMonth(p.deadline, selectedMonth)) {
                totalProvisioned += residualValue;
                provisionedItems.push({
                    id: `deadline-res-${p.id}`,
                    title: "Saldo Estimado (Residual)",
                    amount: residualValue,
                    date: p.deadline,
                    type: 'parcela',
                    projectName: p.name
                });
            }

            // ... Costs (excluding installment income) unchanged ...
            const costsTotal = p.project_costs
                ?.filter(c => c.category !== "receita_parcela")
                .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            if (selectedMonth === "all") {
                totalIncome += alreadyPaid;
                totalRemaining += (p.value || 0) - alreadyPaid;
                totalProjectCosts += costsTotal;
            } else {
                if (isInSelectedMonth(advanceDate, selectedMonth)) {
                    totalIncome += advanceReceived;
                }
                installments.forEach(c => {
                    if (isInSelectedMonth(c.date, selectedMonth) && (c.date <= today || isProjectFullyPaid)) {
                        totalIncome += Number(c.amount);
                    }
                });

                if (isInSelectedMonth(p.created_at, selectedMonth)) {
                    totalProjectCosts += costsTotal;
                }
            }

            // 2. Recurring Income
            const isRecurringActive = p.billing_type === "recorrente" && p.contract_status === "active";
            if (isRecurringActive) {
                const servicesArray = Array.isArray(p.services) ? p.services : [];
                const billingConfig = servicesArray.find((s: any) => s.name === "__billing_config__");
                const condition = billingConfig?.condition || 'immediate';
                const timing = billingConfig?.timing || 'start'; // 'start' = Antecipado, 'end' = Postecipado
                const paymentModel = billingConfig?.paymentModel || 'full';

                let currentBillingDate = p.next_billing_date;
                const duration = billingConfig?.contractDuration || 12;

                // Projection logic: based on contract duration - Arthur Marques Sign
                for (let i = 0; i < duration; i++) {
                    if (!currentBillingDate) break;

                    // Competence adjustment: if 'end', the work happened in the PREVIOUS month
                    if (isInSelectedMonth(currentBillingDate, selectedMonth)) {
                        const validBillingDate = toValidDate(currentBillingDate);
                        if (!validBillingDate) break;

                        let shouldBill = true;
                        const tValue = billingConfig?.condition;
                        if (tValue === 'post_installments' && p.project_costs && p.project_costs.length > 0) {
                            const lastInstallmentDate = p.project_costs
                                .filter(c => c.category === "receita_parcela")
                                .reduce((max, c) => c.date > max ? c.date : max, "");
                            if (lastInstallmentDate && currentBillingDate <= lastInstallmentDate) {
                                shouldBill = false;
                            }
                        }

                        if (shouldBill) {
                            const totalValue = Number(p.value) || 0;
                            const isFutureBilling = currentBillingDate > today;

                            if (!isFutureBilling) {
                                totalIncome += totalValue;
                            } else {
                                const titleSuffix = " (Mensalidade)";
                                if (paymentModel === 'split') {
                                    const halfAmt = totalValue / 2;

                                    totalProvisioned += halfAmt;
                                    provisionedItems.push({
                                        id: `recurring-ent-${p.id}-${i}`,
                                        title: `Entrada 50% - ${i + 1}º ciclo${titleSuffix}`,
                                        amount: halfAmt,
                                        date: currentBillingDate,
                                        type: 'recorrente',
                                        projectName: p.name
                                    });

                                    const d = toValidDate(currentBillingDate + 'T12:00:00');
                                    if (d) {
                                        const lastDayOfMonthDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                                        const remainderDateISO = safeToISOString(lastDayOfMonthDate);
                                        if (remainderDateISO) {
                                            const remainderDate = remainderDateISO.split('T')[0];
                                            totalProvisioned += halfAmt;
                                            provisionedItems.push({
                                                id: `recurring-rem-${p.id}-${i}`,
                                                title: `Saldo 50% - ${i + 1}º ciclo${titleSuffix}`,
                                                amount: halfAmt,
                                                date: remainderDate,
                                                type: 'recorrente',
                                                projectName: p.name
                                            });
                                        }
                                    }
                                } else if (paymentModel === 'installments') {
                                    const count = billingConfig?.recurringInstallmentCount || 1;
                                    const partAmt = totalValue / count;

                                    for (let j = 0; j < count; j++) {
                                        const d = toValidDate(currentBillingDate + 'T12:00:00');
                                        let installmentDate = currentBillingDate;
                                        if (d && j > 0) {
                                            d.setDate(d.getDate() + (j * 15));
                                            installmentDate = safeToISOString(d)?.split('T')[0] || currentBillingDate;
                                        }

                                        totalProvisioned += partAmt;
                                        provisionedItems.push({
                                            id: `recurring-inst-${p.id}-${i}-${j}`,
                                            title: `Parc ${j + 1}/${count} - ${i + 1}º ciclo${titleSuffix}`,
                                            amount: partAmt,
                                            date: installmentDate,
                                            type: 'recorrente',
                                            projectName: p.name
                                        });
                                    }
                                } else {
                                    totalProvisioned += totalValue;
                                    provisionedItems.push({
                                        id: `recurring-${p.id}-${i}`,
                                        title: `Faturamento ${i + 1}º ciclo${titleSuffix}`,
                                        amount: totalValue,
                                        date: currentBillingDate,
                                        type: 'recorrente',
                                        projectName: p.name
                                    });
                                }
                            }
                        }
                    }

                    // Move to next month for the next iteration (outside the if! - fixed)
                    const nextDateObj = toValidDate(currentBillingDate + 'T12:00:00');
                    if (nextDateObj) {
                        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
                        currentBillingDate = safeToISOString(nextDateObj)?.split('T')[0] || null;
                    } else {
                        break;
                    }
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
