import { useState } from "react";
import { Plus, Loader2, ChevronRight, ChevronLeft, Check, ListTodo, User, Calendar, Briefcase, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { IconPicker } from "./IconPicker";

type ProjectStatus = "active" | "planning" | "review" | "completed";

interface NewProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function NewProjectDialog({ open: externalOpen, onOpenChange: setExternalOpen, trigger }: NewProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    // Step 1: Projeto & Cliente
    const [newName, setNewName] = useState("");
    const [newClient, setNewClient] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newIcon, setNewIcon] = useState("Briefcase");

    // Step 2: Prazo & Responsável
    const [newDeadline, setNewDeadline] = useState("");
    const [newManager, setNewManager] = useState("");
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
    const [newValue, setNewValue] = useState<number | "">("");

    // Step 3: Tarefas
    const [tasks, setTasks] = useState<{ id: string, title: string }[]>([]);
    const [taskInput, setTaskInput] = useState("");

    const resetForm = () => {
        setStep(1);
        setNewName("");
        setNewClient("");
        setNewDesc("");
        setNewDeadline("");
        setNewManager("");
        setNewPriority("medium");
        setNewValue("");
        setNewIcon("Briefcase");
        setTasks([]);
        setTaskInput("");
    };

    const addTask = () => {
        if (!taskInput.trim()) return;
        setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), title: taskInput.trim() }]);
        setTaskInput("");
    };

    const removeTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const createProjectMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Create Project
            const { data: project, error: pError } = await supabase
                .from("projects")
                .insert({
                    name: newName,
                    description: newDesc,
                    client_name: newClient,
                    manager_name: newManager,
                    status: "planning",
                    priority: newPriority,
                    deadline: newDeadline || null,
                    user_id: user.id,
                    progress: 0,
                    value: newValue || 0,
                    avatar_emoji: newIcon,
                })
                .select()
                .single();

            if (pError) throw pError;

            // 2. Create Default Columns for this project
            const defaultColsToInsert = [
                { project_id: project.id, title: "Início", hint: "Planeje e quebre em passos", position: 0, color: "hsl(215, 20%, 65%)", user_id: user.id },
                { project_id: project.id, title: "Em Progresso", hint: "Foco no que está em execução", position: 1, color: "hsl(158, 64%, 52%)", user_id: user.id },
                { project_id: project.id, title: "Concluído", hint: "Entrega e validação", position: 2, color: "hsl(221, 83%, 62%)", user_id: user.id }
            ];

            const { data: createdCols, error: cError } = await (supabase as any).from("kanban_columns").insert(defaultColsToInsert).select();
            if (cError) throw cError;

            const todoColId = createdCols.find((c: any) => c.position === 0)?.id || "todo";

            // 3. Create Tasks if any
            if (tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({
                    title: t.title,
                    project_id: project.id,
                    user_id: user.id,
                    column_id: todoColId,
                    progress: 0,
                    priority: "medium"
                }));

                const { error: tError } = await (supabase as any).from("tasks").insert(tasksToInsert);
                if (tError) throw tError;
            }

            return project;
        },
        onSuccess: (project) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({
                title: "🔥 Projeto Criado!",
                description: `O projeto "${project.name}" foi configurado com sucesso.`,
            });
            setOpen(false);
            resetForm();
            // Redirect to the new project's view (assuming we have a project detail page or go to tasks)
            navigate(`/projetos/${project.id}`);
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar projeto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const nextStep = () => {
        if (step === 1 && !newName) {
            toast({ title: "Atenção", description: "O nome do projeto é obrigatório." });
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="glass border-border/50 max-w-xl p-0 overflow-hidden">
                {/* Header with Progress Bar */}
                <div className="relative h-1.5 w-full bg-muted/20">
                    <motion.div
                        className="absolute h-full bg-primary shadow-glow"
                        initial={{ width: "33.33%" }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            {step === 1 && <Briefcase className="h-4 w-4" />}
                            {step === 2 && <User className="h-4 w-4" />}
                            {step === 3 && <ListTodo className="h-4 w-4" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                Passo {step} de 3
                            </span>
                        </div>
                        <DialogTitle className="text-2xl font-semibold tracking-tight">
                            {step === 1 && "O que vamos construir?"}
                            {step === 2 && "Prazos e Responsabilidades"}
                            {step === 3 && "Quais as primeiras tarefas?"}
                        </DialogTitle>
                    </DialogHeader>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {step === 1 && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-name" className="text-xs uppercase tracking-wider opacity-60">Nome do Projeto</Label>
                                        <Input
                                            id="project-name"
                                            placeholder="Ex: Identidade Visual NoteFreela"
                                            className="glass-light border-border/50 h-12 text-lg focus:ring-primary/20"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider opacity-60">Ícone do Projeto</Label>
                                        <div className="flex items-center gap-3">
                                            <IconPicker value={newIcon} onChange={setNewIcon} />
                                            <span className="text-xs text-muted-foreground">Personalize a identidade do projeto</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-client" className="text-xs uppercase tracking-wider opacity-60 flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> Cliente
                                        </Label>
                                        <Input
                                            id="project-client"
                                            placeholder="Ex: Startup X ou Nome do Cliente"
                                            className="glass-light border-border/50"
                                            value={newClient}
                                            onChange={(e) => setNewClient(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-desc" className="text-xs uppercase tracking-wider opacity-60">Descrição Rápida (Opcional)</Label>
                                        <Input
                                            id="project-desc"
                                            placeholder="Do que se trata o projeto?"
                                            className="glass-light border-border/50"
                                            value={newDesc}
                                            onChange={(e) => setNewDesc(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="project-deadline" className="text-xs uppercase tracking-wider opacity-60 flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Prazo Final
                                            </Label>
                                            <Input
                                                id="project-deadline"
                                                type="date"
                                                className="glass-light border-border/50 h-11 [color-scheme:dark]"
                                                value={newDeadline}
                                                onChange={(e) => setNewDeadline(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="project-manager" className="text-xs uppercase tracking-wider opacity-60 flex items-center gap-2">
                                                <User className="h-3 w-3" /> Responsável
                                            </Label>
                                            <Input
                                                id="project-manager"
                                                placeholder="Nome do responsável"
                                                className="glass-light border-border/50 h-11"
                                                value={newManager}
                                                onChange={(e) => setNewManager(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="project-value" className="text-xs uppercase tracking-wider opacity-60 flex items-center gap-2">
                                                <DollarSign className="h-3 w-3" /> Valor Estimado (R$)
                                            </Label>
                                            <Input
                                                id="project-value"
                                                type="number"
                                                placeholder="0,00"
                                                className="glass-light border-border/50 h-11"
                                                value={newValue}
                                                onChange={(e) => setNewValue(Number(e.target.value))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider opacity-60">Prioridade Inicial</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['low', 'medium', 'high'] as const).map((p) => (
                                                    <Button
                                                        key={p}
                                                        type="button"
                                                        variant={newPriority === p ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setNewPriority(p)}
                                                        className={newPriority === p ? "bg-primary/20 text-primary border-primary/50" : "glass-light border-border/50"}
                                                    >
                                                        {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Digite uma tarefa e aperte Enter..."
                                                value={taskInput}
                                                onChange={(e) => setTaskInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                                className="glass-light border-border/50 h-11"
                                            />
                                            <Button type="button" onClick={addTask} size="icon" className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                            {tasks.map((task) => (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={task.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/5 border border-border/20 group hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary" />
                                                        <span className="text-sm font-medium">{task.title}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                        onClick={() => removeTask(task.id)}
                                                    >
                                                        <Plus className="h-3 w-3 rotate-45 text-destructive" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            {tasks.length === 0 && (
                                                <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
                                                    <ListTodo className="h-8 w-8 mx-auto opacity-10 mb-2" />
                                                    <p className="text-xs text-muted-foreground">Adicione tarefas iniciais para o projeto.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-3 pt-8 mt-4 border-t border-border/10">
                        {step > 1 ? (
                            <Button
                                variant="outline"
                                className="flex-1 glass-light border-border/50 hover:bg-muted/30"
                                onClick={prevStep}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                className="flex-1 border border-transparent hover:border-border/50"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                        )}

                        {step < 3 ? (
                            <Button
                                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                onClick={nextStep}
                            >
                                Próximo <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                className="flex-1 bg-gradient-to-r from-primary/80 to-accent hover:from-primary hover:to-accent shadow-glow transition-all"
                                onClick={() => createProjectMutation.mutate()}
                                disabled={createProjectMutation.isPending}
                            >
                                {createProjectMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Criar e Abrir Kanban <Check className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
