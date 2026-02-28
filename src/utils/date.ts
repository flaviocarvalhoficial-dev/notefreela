
/**
 * Utilitário para garantir que valores de data sejam parseados com segurança.
 * Evita o crash 'Invalid time value' ao chamar .toISOString()
 */

export function toValidDate(value: any): Date | null {
    if (!value) return null;

    // Se já for Date, validar se é válido
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    // Se for string, verificar se não está no formato brasileiro comum DD/MM/YYYY
    // que o Date() pode parsear errado dependendo do ambiente
    if (typeof value === 'string') {
        if (value.includes('/') && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
            console.warn("[DateUtils] Formato DD/MM/YYYY rejeitado no parse explícito:", value);
            return null;
        }
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function safeToISOString(value: any): string | null {
    const date = toValidDate(value);
    if (!date) return null;
    return date.toISOString();
}

/**
 * Compara se uma data pertence a um mês selecionado (formato YYYY-MM)
 * sem depender de ISOString/timezone.
 */
export function isInSelectedMonth(dateValue: any, selectedMonth: string): boolean {
    if (selectedMonth === "all") return true;
    if (!dateValue) return false;

    // Optimized string-based check to avoid timezone shifts (e.g., YYYY-MM-DD)
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}/.test(dateValue)) {
        return dateValue.substring(0, 7) === selectedMonth;
    }

    const date = toValidDate(dateValue);
    if (!date) return false;

    const [year, month] = selectedMonth.split("-").map(Number);

    return date.getFullYear() === year && (date.getMonth() + 1) === month;
}
