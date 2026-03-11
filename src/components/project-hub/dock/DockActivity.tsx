import { Activity as ActivityIcon } from 'lucide-react';

interface DockActivityProps {
    activities: any[];
}

export const DockActivity = ({ activities }: DockActivityProps) => {
    return (
        <div className="space-y-6 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight uppercase">Histórico de Atividade</h3>
            {activities.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                    <ActivityIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[10px]">Nenhuma atividade registrada.</p>
                </div>
            ) : (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-1.5 before:w-px before:-translate-x-1/2 before:bg-gradient-to-b before:from-border before:to-transparent">
                    {activities.map((activity, idx) => (
                        <div key={idx} className="relative flex items-start gap-4 pl-6">
                            <div className="absolute left-0 w-3 h-3 rounded-full bg-background border-2 border-primary -translate-x-1/2 mt-1" />
                            <div>
                                <p className="text-xs font-medium text-foreground">{activity.title}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">{activity.created_at}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
