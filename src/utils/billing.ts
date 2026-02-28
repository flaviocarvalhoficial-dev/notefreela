import { addMonths, addDays, format, startOfMonth, endOfMonth, setDate } from 'date-fns';

export type BillingModel = '100inicio' | '50_50' | '100fim' | 'parcelado' | 'custom';
export type BillingTrigger = 'immediato' | 'pos_setup';
export type BillingCycle = 'mensal' | 'unico';

export interface BillingConfig {
    model: BillingModel;
    trigger: BillingTrigger;
    cycle: BillingCycle;
    months: number;
    amount: number;
    entryAmount?: number;
    startDate: string;
    endDate?: string;
    installmentCount?: number;
}

export interface InstallmentSeed {
    due_date: string;
    amount: number;
    origin_label: string;
    status: 'provisionado';
}

export function generateInstallments(config: BillingConfig): InstallmentSeed[] {
    const installments: InstallmentSeed[] = [];
    const { model, amount, entryAmount = 0, startDate, installmentCount = 1, months = 0, cycle } = config;
    const baseDate = new Date(startDate + 'T12:00:00');

    // 1. Setup / Pontual Logic
    if (model === '100inicio') {
        installments.push({
            due_date: startDate,
            amount: amount,
            origin_label: 'Setup - Integral',
            status: 'provisionado'
        });
    } else if (model === '50_50') {
        const half = Math.round((amount / 2) * 100) / 100;
        installments.push({
            due_date: startDate,
            amount: half,
            origin_label: 'Setup - Sinal (50%)',
            status: 'provisionado'
        });
        // Second half at end of first month or deadline
        const secondHalfDate = addMonths(baseDate, 1);
        installments.push({
            due_date: format(secondHalfDate, 'yyyy-MM-dd'),
            amount: amount - half,
            origin_label: 'Setup - Final (50%)',
            status: 'provisionado'
        });
    } else if (model === '100fim' && config.endDate) {
        installments.push({
            due_date: config.endDate,
            amount: amount,
            origin_label: 'Setup - Entrega Final',
            status: 'provisionado'
        });
    } else if (model === 'parcelado') {
        const remaining = amount - entryAmount;
        if (entryAmount > 0) {
            installments.push({
                due_date: startDate,
                amount: entryAmount,
                origin_label: 'Setup - Entrada',
                status: 'provisionado'
            });
        }
        if (remaining > 0 && installmentCount > 0) {
            const part = Math.round((remaining / installmentCount) * 100) / 100;
            for (let i = 1; i <= installmentCount; i++) {
                const d = addMonths(baseDate, i);
                installments.push({
                    due_date: format(d, 'yyyy-MM-dd'),
                    amount: i === installmentCount ? Math.round((remaining - (part * (installmentCount - 1))) * 100) / 100 : part,
                    origin_label: `Setup - Parcela ${i}/${installmentCount}`,
                    status: 'provisionado'
                });
            }
        }
    }

    // 2. Recurrence Logic (only if cycle is monthly)
    if (cycle === 'mensal' && months > 0) {
        let recurrenceStartDate = baseDate;

        // If trigger is pos_setup, recurrence starts after the last installment generated above
        if (config.trigger === 'pos_setup' && installments.length > 0) {
            const lastDate = new Date(installments[installments.length - 1].due_date + 'T12:00:00');
            recurrenceStartDate = addMonths(lastDate, 1);
        } else if (config.endDate) {
            // Usually starts after project end
            recurrenceStartDate = addDays(new Date(config.endDate + 'T12:00:00'), 1);
        }

        const monthlyAmount = amount; // In recurring, amount usually represents the monthly fee
        for (let i = 1; i <= months; i++) {
            const d = addMonths(recurrenceStartDate, i - 1);
            installments.push({
                due_date: format(d, 'yyyy-MM-dd'),
                amount: monthlyAmount,
                origin_label: `Mensalidade ${i}/${months}`,
                status: 'provisionado'
            });
        }
    }

    return installments;
}
