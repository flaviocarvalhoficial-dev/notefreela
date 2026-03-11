import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

interface DockFinanceProps {
    project?: Tables<"projects"> | null;
    finance: any[];
    onCreateItem?: (type: string) => void;
}

export const DockFinance = ({ project, finance, onCreateItem }: DockFinanceProps) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const valorTotal = project?.value ?? 0;
    const recebido = project?.advance_payment ?? 0;
    const totalCustos = finance.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
    const lucro = recebido - totalCustos;

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">RESUMO FINANCEIRO</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => onCreateItem?.('finance')}
                >
                    <Plus className="w-3 h-3" /> LANÇAR
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-secondary/10 border border-border rounded-lg">
                    <p className="text-[9px] font-medium text-muted-foreground tracking-tight ">VALOR</p>
                    <p className="text-sm font-medium text-foreground tabular-nums mask-value">{fmt(valorTotal)}</p>
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <p className="text-[9px] font-medium text-emerald-600/60 tracking-tight ">RECEBIDO</p>
                    <p className="text-sm font-medium text-emerald-500 tabular-nums mask-value">{fmt(recebido)}</p>
                </div>
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                    <p className="text-[9px] font-medium text-rose-600/60 tracking-tight ">CUSTOS</p>
                    <p className="text-sm font-medium text-rose-500 tabular-nums mask-value">{fmt(totalCustos)}</p>
                </div>
            </div>

            {/* Balance / Lucro */}
            <div className={cn(
                "p-2.5 rounded-lg border flex items-center justify-between",
                lucro >= 0
                    ? "bg-emerald-500/5 border-emerald-500/15"
                    : "bg-rose-500/5 border-rose-500/15"
            )}>
                <span className="text-[9px] font-medium tracking-tight text-muted-foreground ">LUCRO / SALDO</span>
                <span className={cn(
                    "text-xs font-bold tabular-nums",
                    lucro >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                    <span className="mask-value">{lucro >= 0 ? '+' : ''}{fmt(lucro)}</span>
                </span>
            </div>

            <div className="space-y-3 pt-2">
                <p className="text-[9px] font-medium text-muted-foreground tracking-tight px-1">LANÇAMENTOS</p>
                {finance.length === 0 && (
                    <div className="text-center py-8 opacity-30">
                        <p className="text-xs">Nenhum custo lançado.</p>
                    </div>
                )}
                {finance.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <div>
                                <p className="text-xs font-medium">{entry.title}</p>
                                <p className="text-[8px] text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <p className="text-xs font-medium tabular-nums text-rose-500 mask-value">
                            -{fmt(Math.abs(entry.amount))}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
