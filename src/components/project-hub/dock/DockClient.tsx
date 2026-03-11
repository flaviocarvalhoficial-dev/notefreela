import { Plus, User, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PropertyItem } from './PropertyItem';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { Tables } from '@/integrations/supabase/types';

interface DockClientProps {
    project?: Tables<"projects"> | null;
    client?: Tables<"clients"> | null;
    extraProperties: string[];
    setExtraProperties: React.Dispatch<React.SetStateAction<string[]>>;
    updateProject: (updates: any) => void;
    updateClient: (updates: any) => void;
    navigate: (path: string) => void;
}

export const DockClient = ({
    project,
    client,
    extraProperties,
    setExtraProperties,
    updateProject,
    updateClient,
    navigate
}: DockClientProps) => {
    return (
        <div className="py-6 px-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Propriedades</h3>
                <button onClick={() => navigate('/clientes')} className="text-muted-foreground/40 hover:text-primary transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="space-y-0.5">
                <PropertyItem
                    icon={LucideIcons.AlignLeft}
                    label="Cliente"
                    value={project?.client_name}
                    isEditable={false}
                />

                <PropertyItem
                    icon={LucideIcons.ChevronDownCircle}
                    label="Tipo de projeto"
                    value={
                        project?.service_type ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold px-2 py-0 h-5 uppercase">
                                {project.service_type}
                            </Badge>
                        ) : null
                    }
                    onSave={(val) => updateProject({ id: project?.id!, service_type: val })}
                />

                <PropertyItem
                    icon={LucideIcons.ChevronDownCircle}
                    label="Área"
                    value={
                        <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 border-none text-[10px] font-bold px-2 py-0 h-5 uppercase">
                            Serviço
                        </Badge>
                    }
                    isEditable={false}
                />

                <PropertyItem
                    icon={LucideIcons.AlignLeft}
                    label="Cidade"
                    value={client?.city}
                    onSave={(val) => updateClient({ id: client?.id!, updates: { city: val } })}
                />

                <PropertyItem
                    icon={LucideIcons.User}
                    label="Responsável"
                    value={
                        <div className="flex items-center gap-1.5 group/user">
                            <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                <User className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="truncate">{project?.manager_name || 'Flávio Carvalho'}</span>
                        </div>
                    }
                    onSave={(val) => updateProject({ id: project?.id!, manager_name: val })}
                />

                <PropertyItem
                    icon={LucideIcons.Calendar}
                    label="Meta"
                    type="date"
                    value={project?.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : null}
                    onSave={(val) => updateProject({ id: project?.id!, deadline: val })}
                />

                <PropertyItem
                    icon={LucideIcons.CircleDashed}
                    label="Status"
                    type="select"
                    options={[
                        { label: 'Planejamento', value: 'planning' },
                        { label: 'Em andamento', value: 'active' },
                        { label: 'Revisão', value: 'review' },
                        { label: 'Concluído', value: 'completed' }
                    ]}
                    value={
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none text-[10px] font-bold px-2 py-0 h-5 inline-flex items-center gap-1.5 uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {project?.status === 'active' ? 'Em andamento' : (project?.status || 'Em andamento')}
                        </Badge>
                    }
                    onSave={(val) => updateProject({ id: project?.id!, status: val as any })}
                />

                <PropertyItem
                    icon={LucideIcons.ChevronDownCircle}
                    label="Integrantes"
                    value={
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-none text-[10px] font-bold px-2 py-0 h-5 uppercase">
                            {project?.team_size === 1 || !project?.team_size ? 'Solo' : `${project.team_size} Membros`}
                        </Badge>
                    }
                    onSave={(val) => updateProject({ id: project?.id!, team_size: parseInt(val) || 1 })}
                />

                {extraProperties.includes('billing_type') && (
                    <PropertyItem
                        icon={LucideIcons.Hash}
                        label="Faturamento"
                        type="select"
                        options={[
                            { label: 'Pontual', value: 'pontual' },
                            { label: 'Recorrente', value: 'recorrente' }
                        ]}
                        value={
                            project?.billing_type ? (
                                <Badge variant="outline" className="text-[10px] font-medium uppercase border-muted-foreground/20">
                                    {project.billing_type}
                                </Badge>
                            ) : null
                        }
                        onSave={(val) => updateProject({ id: project?.id!, billing_type: val as any })}
                    />
                )}

                {extraProperties.includes('value') && (
                    <PropertyItem
                        icon={LucideIcons.DollarSign}
                        label="Investimento"
                        value={project?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value) : null}
                        onSave={(val) => updateProject({ id: project?.id!, value: parseFloat(val) || 0 })}
                    />
                )}

                <div className="relative group/menu mt-2">
                    <button className="flex items-center gap-2.5 px-2.5 py-2 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors w-full group">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-[13px] font-medium">Adicionar propriedade</span>
                    </button>

                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-card border border-border shadow-xl rounded-xl p-1 opacity-0 pointer-events-none group-focus-within/menu:opacity-100 group-focus-within/menu:pointer-events-auto transition-all z-50">
                        <button
                            onClick={() => setExtraProperties(p => p.includes('billing_type') ? p : [...p, 'billing_type'])}
                            className="w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-muted rounded-md transition-colors"
                        >
                            Faturamento
                        </button>
                        <button
                            onClick={() => setExtraProperties(p => p.includes('value') ? p : [...p, 'value'])}
                            className="w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-muted rounded-md transition-colors"
                        >
                            Valor Total
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-6 space-y-4">
                {project?.client_id ? (
                    <NewClientDialog
                        client={client}
                        trigger={
                            <Button
                                className="w-full h-11 text-[11px] font-bold gap-2 bg-primary hover:bg-primary-hover shadow-glow-sm rounded-xl"
                            >
                                EDITAR PERFIL COMPLETO <ArrowRight className="w-4 h-4" />
                            </Button>
                        }
                    />
                ) : (
                    <div className="text-center py-10 px-6 border-2 border-dashed border-border rounded-3xl bg-muted/5 flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-500">
                        <div className="p-4 rounded-full bg-primary/5">
                            <User className="h-10 w-10 text-primary opacity-20" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold tracking-tight uppercase opacity-60">Nenhum cliente vinculado</p>
                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-[200px] mx-auto">
                                Vincule um cliente para centralizar contatos e informações estratégicas.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-6 text-[11px] font-bold border-primary text-primary hover:bg-primary/5 rounded-full shadow-glow-sm"
                            onClick={() => navigate('/clientes')}
                        >
                            VINCULAR AGORA
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
