import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutGrid,
    Target,
    BookOpen,
    Lock,
    Plus,
    Trash2,
    CheckCircle2,
    TrendingUp,
    ChevronRight,
    Search,
    MoreVertical,
    Loader2,
    Clock,
    Zap,
    Users,
    Sun,
    Droplets,
    Heart,
    DollarSign,
    Eye,
    EyeOff,
    ExternalLink,
    Dumbbell as WorkoutIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    useHabits,
    useToggleHabit,
    useCreateHabit,
    useDeleteHabit,
    useUpdateCategory,
    useCreateCategory,
    usePersonalCourses,
    useUpsertCourse,
    useDeleteCourse,
    useCredentials,
    useUpsertCredential,
    useDeleteCredential,
    Habit,
    PersonalCourse,
    Credential,
    HabitCategory
} from "@/hooks/use-personal-hub";

const ICON_MAP: Record<string, any> = {
    Target: Target,
    Workout: WorkoutIcon,
    Heart: Heart,
    Droplets: Droplets,
    Book: BookOpen,
    Users: Users,
    Sun: Sun,
    Dollar: DollarSign,
    Zap: Zap,
    Clock: Clock,
};

const ICON_LIST = Object.keys(ICON_MAP);

const GestaoPessoal = () => {
    const [activeTab, setActiveTab] = useState("habitos");

    return (
        <div className="page-container h-full overflow-y-auto custom-scrollbar">
            {/* Header Section */}
            <header className="heading-container">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full" />
                    <span className="text-[10px] font-medium tracking-tight text-primary">Workspace / Hub Pessoal</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">Gestão & Hábitos</h1>
                        <p className="text-muted-foreground font-normal text-sm leading-relaxed">Sincronize sua produtividade com seu bem-estar pessoal</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                        <TabsList className="bg-muted/50 p-1 h-11 border border-border/50">
                            <TabsTrigger value="habitos" className="gap-2 px-4 text-[12px] font-medium transition-all">
                                <Target className="h-3.5 w-3.5" />
                                Hábitos
                            </TabsTrigger>
                            <TabsTrigger value="cursos" className="gap-2 px-4 text-[12px] font-medium transition-all">
                                <BookOpen className="h-3.5 w-3.5" />
                                Cursos
                            </TabsTrigger>
                            <TabsTrigger value="acessos" className="gap-2 px-4 text-[12px] font-medium transition-all">
                                <Lock className="h-3.5 w-3.5" />
                                Acessos
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === "habitos" && <HabitsSection />}
                    {activeTab === "cursos" && <CoursesSection />}
                    {activeTab === "acessos" && <AccessSection />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// --- SUB-SECTIONS ---

const HabitsSection = () => {
    const { data, isLoading } = useHabits();
    const createHabit = useCreateHabit();
    const createCategory = useCreateCategory();
    const deleteHabit = useDeleteHabit();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState<Partial<Habit>>({
        title: "",
        frequency: "daily",
        target_days: 1,
        category_id: undefined,
        category: "", // For new category names
        metadata: { time: "", shift: "manhã", distance: "", goal: "", unit: "" }
    });

    const handleAddHabit = async () => {
        if (!newHabit.title) return;

        let finalCategoryId = newHabit.category_id;

        // Se for uma nova categoria (nome fornecido mas sem ID)
        if (!finalCategoryId && newHabit.category) {
            try {
                const newCat = await createCategory.mutateAsync({
                    name: newHabit.category,
                    icon: "Target"
                });
                finalCategoryId = newCat.id;
            } catch (err) {
                console.error("Erro ao criar categoria", err);
            }
        }

        await createHabit.mutateAsync({
            ...newHabit,
            category_id: finalCategoryId
        });

        setIsAddModalOpen(false);
        setNewHabit({
            title: "", frequency: "daily", target_days: 1, category_id: undefined, category: "",
            metadata: { time: "", shift: "manhã", distance: "", goal: "", unit: "" }
        });
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 opacity-20" /></div>;

    const habits = data?.habits || [];
    const dbCategories = data?.categories || [];
    const hasHabits = habits.length > 0;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <Button
                    onClick={() => {
                        setNewHabit({
                            title: "",
                            frequency: "daily",
                            target_days: 1,
                            metadata: { time: "", shift: "manhã", distance: "", goal: "", unit: "" }
                        });
                        setIsAddModalOpen(true);
                    }}
                    className="gap-2 rounded-xl h-11 px-6 shadow-glow-sm transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4" />
                    Novo Hábito
                </Button>
            </div>

            {!hasHabits ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                    <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                        <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold">Nenhum hábito rastreado</p>
                        <p className="text-xs">Clique em 'Novo Hábito' para começar sua rotina.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dbCategories.map((cat: HabitCategory) => {
                        const catHabits = habits.filter(h => h.category_id === cat.id);
                        if (catHabits.length === 0) return null;
                        const IconComponent = ICON_MAP[cat.icon || "Target"] || Target;
                        return (
                            <HabitBentoCard
                                key={cat.id}
                                category={{
                                    ...cat,
                                    icon: IconComponent,
                                    icon_name: cat.icon || "Target"
                                }}
                                habits={catHabits}
                                onDelete={deleteHabit.mutate}
                                onAddMore={() => {
                                    setNewHabit({
                                        category_id: cat.id,
                                        frequency: 'daily',
                                        metadata: { ...newHabit.metadata, is_running: cat.name.toLowerCase().includes('treino') }
                                    });
                                    setIsAddModalOpen(true);
                                }}
                            />
                        );
                    })}
                    {habits.filter(h => !h.category_id).length > 0 && (
                        <HabitBentoCard
                            category={{ name: "Geral", icon: Target, bg: "bg-muted/10", color: "text-muted-foreground" }}
                            habits={habits.filter(h => !h.category_id)}
                            onDelete={deleteHabit.mutate}
                            onAddMore={() => {
                                setNewHabit({ frequency: 'daily' });
                                setIsAddModalOpen(true);
                            }}
                        />
                    )}
                </div>
            )}

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Hábito</DialogTitle>
                        <DialogDescription>Defina sua meta e peculiaridades.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>O que você quer fazer?</Label>
                            <Input
                                placeholder="Ex: Musculação, Ler 10 páginas..."
                                value={newHabit.title}
                                onChange={e => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Select
                                    value={newHabit.frequency}
                                    onValueChange={val => setNewHabit(prev => ({ ...prev, frequency: val as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Diária</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={newHabit.category_id || "new"}
                                    onValueChange={val => setNewHabit(prev => ({ ...prev, category_id: val === "new" ? undefined : val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nova Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Criar Nova...</SelectItem>
                                        {dbCategories.map((c: HabitCategory) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!newHabit.category_id && (
                            <div className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/40">
                                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Nova Categoria</Label>
                                <Input
                                    placeholder="Ex: Saúde, Lazer, Estudos..."
                                    value={newHabit.category || ""}
                                    onChange={e => setNewHabit(prev => ({ ...prev, category: e.target.value }))}
                                    className="bg-background"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Input
                                    type="time"
                                    value={newHabit.metadata?.time}
                                    onChange={e => setNewHabit(prev => ({ ...prev, metadata: { ...prev.metadata, time: e.target.value } }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta</Label>
                                <Input
                                    placeholder="Ex: 3"
                                    value={newHabit.metadata?.goal}
                                    onChange={e => setNewHabit(prev => ({ ...prev, metadata: { ...prev.metadata, goal: e.target.value } }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unidade</Label>
                                <Input
                                    placeholder="Ex: L"
                                    value={newHabit.metadata?.unit}
                                    onChange={e => setNewHabit(prev => ({ ...prev, metadata: { ...prev.metadata, unit: e.target.value } }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Turno</Label>
                                <Select
                                    value={newHabit.metadata?.shift}
                                    onValueChange={val => setNewHabit(prev => ({ ...prev, metadata: { ...prev.metadata, shift: val } }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manhã">Manhã</SelectItem>
                                        <SelectItem value="tarde">Tarde</SelectItem>
                                        <SelectItem value="noite">Noite</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {(newHabit.category?.toLowerCase() === 'treino' || dbCategories.find(c => c.id === newHabit.category_id)?.name.toLowerCase().includes('treino')) && (
                                <div className="space-y-2">
                                    <Label>Distância (KM)</Label>
                                    <Input
                                        placeholder="Ex: 5km"
                                        value={newHabit.metadata?.distance}
                                        onChange={e => setNewHabit(prev => ({ ...prev, metadata: { ...prev.metadata, distance: e.target.value } }))}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddHabit} disabled={createHabit.isPending}>
                            {createHabit.isPending ? "Salvando..." : "Criar Hábito"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const HabitBentoCard = ({ category, habits, onDelete, onAddMore }: any) => {
    const toggleHabit = useToggleHabit();
    const updateCategory = useUpdateCategory();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: category.name, icon: category.icon_name || "Target" });

    const handleUpdate = async () => {
        if (!category.id) return;
        await updateCategory.mutateAsync({ id: category.id, name: editData.name, icon: editData.icon });
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bento-card flex flex-col h-full"
        >
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                        <button
                            onClick={() => category.id && setIsEditing(true)}
                            className={cn(
                                "p-2 rounded-xl transition-all",
                                category.bg || "bg-primary/10",
                                category.color || "text-primary",
                                category.id && "hover:ring-2 hover:ring-primary/20 cursor-pointer"
                            )}
                        >
                            <category.icon className="h-4 w-4" />
                        </button>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Personalizar Card</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome da Categoria</Label>
                                    <Input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ícone</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {ICON_LIST.map(iconName => {
                                            const Icon = ICON_MAP[iconName];
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setEditData({ ...editData, icon: iconName })}
                                                    className={cn(
                                                        "p-3 rounded-lg border flex items-center justify-center transition-all",
                                                        editData.icon === iconName ? "bg-primary text-white border-primary" : "hover:bg-muted"
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleUpdate}>Salvar Alterações</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <div>
                        <h3 className="text-[14px] font-semibold tracking-tight">{category.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{habits.length} {habits.length === 1 ? 'hábito' : 'hábitos'}</p>
                    </div>
                </div>
                {onAddMore && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={onAddMore}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4">
                {habits.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic text-center py-4">Nenhum hábito rastreado aqui.</p>
                ) : (
                    habits.map((habit: Habit) => (
                        <div key={habit.id} className="space-y-3">
                            <div className="flex items-center justify-between group/habit">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleHabit.mutate({ habitId: habit.id, completed: !habit.completed_today })}
                                        disabled={toggleHabit.isPending}
                                        className={cn(
                                            "h-5 w-5 rounded-md border transition-all flex items-center justify-center",
                                            habit.completed_today
                                                ? "bg-primary border-primary text-white shadow-glow-sm"
                                                : "border-border bg-muted/20 hover:border-primary/50"
                                        )}
                                    >
                                        {habit.completed_today && <CheckCircle2 className="h-3 w-3" />}
                                    </button>
                                    <div className="min-w-0 flex flex-col">
                                        <span className={cn(
                                            "text-[13px] font-medium transition-colors",
                                            habit.completed_today ? "text-muted-foreground" : "text-foreground"
                                        )}>
                                            {habit.title}
                                        </span>
                                        <div className="flex items-center gap-2 pt-0.5">
                                            {habit.metadata?.time && (
                                                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5" /> {habit.metadata.time}
                                                </span>
                                            )}
                                            {habit.metadata?.distance && (
                                                <span className="text-[9px] text-primary font-bold flex items-center gap-1">
                                                    <Zap className="h-2.5 w-2.5 text-primary" /> {habit.metadata.distance}
                                                </span>
                                            )}
                                            {habit.metadata?.goal && (
                                                <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[8px] font-bold uppercase tracking-tighter bg-primary/5 text-primary border-none">
                                                    {habit.metadata.goal} {habit.metadata.unit}
                                                </Badge>
                                            )}
                                            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter">
                                                {habit.frequency}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold text-primary opacity-0 group-hover/habit:opacity-100 transition-opacity">
                                        {habit.progress}%
                                    </span>
                                    <button
                                        onClick={() => onDelete(habit.id)}
                                        className="text-destructive/50 hover:text-destructive opacity-0 group-hover/habit:opacity-100 transition-all p-1"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Progress value={habit.progress} className="h-1 bg-primary/5" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

const CoursesSection = () => {
    const { data: courses = [], isLoading } = usePersonalCourses();
    const upsertCourse = useUpsertCourse();
    const deleteCourse = useDeleteCourse();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<Partial<PersonalCourse>>({
        title: "", platform: "", progress_percent: 0, status: "not_started"
    });

    const handleSave = async () => {
        await upsertCourse.mutateAsync(currentCourse);
        setIsModalOpen(false);
        setCurrentCourse({ title: "", platform: "", progress_percent: 0, status: "not_started" });
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 opacity-20" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Curso
                </Button>
            </div>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                    <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold">Nenhum curso registrado</p>
                        <p className="text-xs">Rastreie seu aprendizado clicando em 'Novo Curso'.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="bento-card flex flex-col overflow-hidden group">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-start justify-between">
                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest h-5">
                                        {course.platform}
                                    </Badge>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                            onClick={() => deleteCourse.mutate(course.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7"
                                            onClick={() => { setCurrentCourse(course); setIsModalOpen(true); }}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-[15px] pt-4 font-semibold">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 flex-1">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-muted-foreground uppercase tracking-tighter">Progresso</span>
                                        <span className="text-primary">{course.progress_percent}%</span>
                                    </div>
                                    <Progress value={course.progress_percent} className="h-1.5" />
                                </div>
                            </CardContent>
                            <div className="px-5 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    course.status === "completed" ? "text-emerald-500" : "text-blue-500"
                                )}>
                                    {course.status === "completed" ? "Concluído" : "Em Andamento"}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentCourse.id ? "Editar Curso" : "Novo Curso"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Título do Curso</Label>
                            <Input
                                value={currentCourse.title}
                                onChange={e => setCurrentCourse({ ...currentCourse, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Plataforma</Label>
                                <Input
                                    value={currentCourse.platform || ""}
                                    onChange={e => setCurrentCourse({ ...currentCourse, platform: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Progresso (%)</Label>
                                <Input
                                    type="number"
                                    value={currentCourse.progress_percent}
                                    onChange={e => setCurrentCourse({ ...currentCourse, progress_percent: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const AccessSection = () => {
    const { data: credentials = [], isLoading } = useCredentials();
    const upsertCredential = useUpsertCredential();
    const deleteCredential = useDeleteCredential();
    const [showPass, setShowPass] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCred, setCurrentCred] = useState<Partial<Credential>>({
        service_name: "", login_user: "", login_password: "", url: ""
    });

    const handleSave = async () => {
        await upsertCredential.mutateAsync(currentCred);
        setIsModalOpen(false);
        setCurrentCred({ service_name: "", login_user: "", login_password: "", url: "" });
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 opacity-20" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between bg-card border border-border/50 p-4 rounded-xl shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full pl-10 h-10 bg-muted/40 border-none rounded-lg text-sm transition-all outline-none"
                        placeholder="Filtrar acessos..."
                    />
                </div>
                <Button className="h-10 rounded-lg gap-2" onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Novo Acesso
                </Button>
            </div>

            {credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                    <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold">Nenhum acesso guardado</p>
                        <p className="text-xs">Armazene suas senhas com segurança.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credentials.map((acesso) => (
                        <Card key={acesso.id} className="bento-card group hover:border-primary/20 transition-all">
                            <CardHeader className="p-5 pb-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-primary/5 rounded-xl">
                                        <LayoutGrid className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
                                            onClick={() => deleteCredential.mutate(acesso.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                            onClick={() => { setCurrentCred(acesso); setIsModalOpen(true); }}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-[16px] font-semibold">{acesso.service_name}</CardTitle>
                                <p className="text-[11px] text-muted-foreground truncate">{acesso.url}</p>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-border/30 relative">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Login</label>
                                    <p className="text-[12px] font-medium truncate">{acesso.login_user}</p>
                                </div>
                                <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-border/30 relative">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Senha</label>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[12px] font-mono tracking-tighter">
                                            {showPass === acesso.id ? acesso.login_password : "••••••••"}
                                        </p>
                                        <button
                                            onClick={() => setShowPass(showPass === acesso.id ? null : acesso.id)}
                                            className="text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {showPass === acesso.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentCred.id ? "Editar Acesso" : "Novo Acesso"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Serviço</Label>
                            <Input
                                value={currentCred.service_name}
                                onChange={e => setCurrentCred({ ...currentCred, service_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Login / Usuário</Label>
                            <Input
                                value={currentCred.login_user || ""}
                                onChange={e => setCurrentCred({ ...currentCred, login_user: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha</Label>
                            <Input
                                value={currentCred.login_password || ""}
                                onChange={e => setCurrentCred({ ...currentCred, login_password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                                value={currentCred.url || ""}
                                onChange={e => setCurrentCred({ ...currentCred, url: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Salvar Acesso</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GestaoPessoal;
