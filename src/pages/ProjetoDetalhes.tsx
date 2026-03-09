import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { ProjectHeader } from "@/components/project-hub/ProjectHeader";
import { BlockEditor } from "@/components/project-hub/BlockEditor";
import { ProjectDock } from "@/components/project-hub/ProjectDock";
import { PageNav } from "@/components/project-hub/PageNav";
import { cn } from "@/lib/utils";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { AddDocumentDialog } from "@/components/projects/AddDocumentDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { CostRegistrationDialog } from "@/components/dashboard/CostRegistrationDialog";
import { AddInboxDialog } from "@/components/project-hub/AddInboxDialog";
import { type BlockEditorRef, type BlockEditorStatus } from "@/components/project-hub/BlockEditor";
interface ActivityLog {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    type: string;
}


const ProjetoHub = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [sourceBlockId, setSourceBlockId] = useState<string | null>(null);
    const [isDockOpen, setIsDockOpen] = useState(true);
    const [isEditingParam, setIsEditingParam] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [isAddInboxOpen, setIsAddInboxOpen] = useState(false);
    const [isAddCostOpen, setIsAddCostOpen] = useState(false);
    const [selectedDocCategory, setSelectedDocCategory] = useState<string>("");

    const editorRef = useRef<BlockEditorRef>(null);
    const [editorStatus, setEditorStatus] = useState({
        hasColumns: false,
        canUndo: false,
        canRedo: false
    });


    const [pageTitleLocal, setPageTitleLocal] = useState("");
    const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deletionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sidebar Resizing
    const [sidebarWidth, setSidebarWidth] = useState(window.innerWidth * 0.3);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 280 && newWidth < 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    // Fetch Project Data
    const { data: project, isLoading } = useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id as string)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Fetch related entities for the Dock
    const { data: tasks = [] } = useQuery({
        queryKey: ["project-tasks", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("project_id", id as string)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: inboxItems = [] } = useQuery({
        queryKey: ["project-inbox", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("inbox")
                .select("*")
                .eq("project_id", id as string);
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: documents = [] } = useQuery({
        queryKey: ["project-documents", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("project_documents")
                .select("*")
                .eq("project_id", id as string);
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: costs = [] } = useQuery({
        queryKey: ["project-costs", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_costs")
                .select("*")
                .eq("project_id", id as string);
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: pages = [] } = useQuery({
        queryKey: ["project-pages", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("project_pages")
                .select("*")
                .eq("project_id", id as string)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!id,
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ["project-transactions", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("transactions")
                .select("*")
                .eq("project_id", id as string);
            if (error) return [];
            return (data || []) as any[];
        },
        enabled: !!id,
    });

    const { data: installments = [] } = useQuery({
        queryKey: ["project-installments", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("installments")
                .select("*")
                .eq("project_id", id as string);
            if (error) return [];
            return (data || []) as any[];
        },
        enabled: !!id,
    });


    const { data: activities = [] } = useQuery({
        queryKey: ["project-activities", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("activities")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(40);

            if (error) throw error;

            // Filter manually if needed or use the project_id if it exists in metadata
            const filtered = data?.filter((a: any) =>
                a.metadata?.project_id === id ||
                a.title?.toLowerCase().includes(project?.name?.toLowerCase())
            ) || [];

            if (filtered.length > 0) return filtered;

            return [
                { title: "Dashboard iniciado", created_at: project?.created_at, type: 'status' }
            ].filter(a => !!a.created_at);
        },
        enabled: !!id && !!project,
    });

    const { data: clientData } = useQuery({
        queryKey: ["clients", project?.client_id],
        queryFn: async () => {
            if (!project?.client_id) return null;
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .eq("id", project.client_id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!project?.client_id
    });


    const activePage = useMemo(() => {
        if (!activePageId) return null;
        return pages.find((p: any) => p.id === activePageId);
    }, [pages, activePageId]);

    // Mutations
    const updateContentMutation = useMutation({
        mutationFn: async (contentBlocks: any) => {
            if (activePageId) {
                const { error } = await (supabase as any)
                    .from("project_pages")
                    .update({ content_blocks: contentBlocks })
                    .eq("id", activePageId);
                if (error) throw error;
            } else {
                const { error } = await (supabase as any)
                    .from("projects")
                    .update({ content_blocks: contentBlocks })
                    .eq("id", id as string);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            if (activePageId) {
                queryClient.invalidateQueries({ queryKey: ["project-pages", id] });
            } else {
                queryClient.invalidateQueries({ queryKey: ["project", id] });
            }
        }
    });

    const createPageMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth required");

            const { data, error } = await (supabase as any).from("project_pages").insert({
                project_id: id,
                user_id: user.id,
                title: "Nova Página",
                content_blocks: []
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: (newPage) => {
            queryClient.invalidateQueries({ queryKey: ["project-pages", id] });
            setActivePageId(newPage.id);
            toast({ title: "Página criada" });
        }
    });

    const deletePageMutation = useMutation({
        mutationFn: async (pageId: string) => {
            const { error } = await (supabase as any)
                .from("project_pages")
                .delete()
                .eq("id", pageId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-pages", id] });
            if (activePageId) setActivePageId(null);
            toast({ title: "Página excluída" });
        }
    });

    const updatePageTitleMutation = useMutation({
        mutationFn: async ({ pageId, title }: { pageId: string; title: string }) => {
            const { error } = await (supabase as any)
                .from("project_pages")
                .update({ title })
                .eq("id", pageId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-pages", id] });
        }
    });

    // Sync local title when active page changes or pages data arrives
    useEffect(() => {
        if (activePage) {
            setPageTitleLocal(activePage.title || "");
        } else {
            setPageTitleLocal("");
        }
    }, [activePageId, activePage?.title]);

    // Debounced title save
    const handlePageTitleChange = useCallback((newTitle: string) => {
        setPageTitleLocal(newTitle);

        if (titleDebounceRef.current) {
            clearTimeout(titleDebounceRef.current);
        }

        const currentPageId = activePageId;
        if (!currentPageId) return;

        titleDebounceRef.current = setTimeout(() => {
            updatePageTitleMutation.mutate({ pageId: currentPageId, title: newTitle });
        }, 500);
    }, [activePageId, updatePageTitleMutation]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
            if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
        };
    }, []);

    const handleContentChange = useCallback((json: any) => {
        if (contentDebounceRef.current) {
            clearTimeout(contentDebounceRef.current);
        }

        contentDebounceRef.current = setTimeout(() => {
            updateContentMutation.mutate(json);
        }, 1000); // 1s debounce to prevent instability during typing
    }, [updateContentMutation]);

    const deleteProjectMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from("projects").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            navigate("/projetos");
        }
    });

    const handleDeleteProject = () => {
        setIsDeleting(false); // Close dialog

        toast({
            title: "Projeto será excluído...",
            description: "Você tem 5 segundos para desfazer esta ação.",
            duration: 5000,
            action: (
                <ToastAction
                    altText="Desfazer"
                    onClick={() => {
                        if (deletionTimeoutRef.current) {
                            clearTimeout(deletionTimeoutRef.current);
                            deletionTimeoutRef.current = null;
                            toast({ title: "Exclusão cancelada", description: "O projeto está seguro." });
                        }
                    }}
                >
                    Desfazer
                </ToastAction>
            ),
        });

        deletionTimeoutRef.current = setTimeout(() => {
            deleteProjectMutation.mutate();
            deletionTimeoutRef.current = null;
        }, 5000);
    };

    const createTaskMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth error");

            const { data, error } = await supabase.from("tasks").insert({
                title: values.title,
                project_id: id,
                priority: values.priority,
                due_date: values.due?.toISOString(),
                assignee: values.assignee,
                user_id: user.id,
                column_id: 'todo'
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
            toast({ title: "Tarefa criada" });

            // If created from editor, insert reference
            if (sourceBlockId) {
                editorRef.current?.insertItem('task', data.id, variables.title);
                setSourceBlockId(null);
            }
        }
    });

    const createInboxMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth error");

            const { data, error } = await supabase.from("inbox").insert({
                title: values.title || values.content?.substring(0, 30),
                content: values.content,
                type: values.type || 'note',
                project_id: id,
                user_id: user.id
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["project-inbox", id] });
            toast({ title: "Captura realizada" });

            if (sourceBlockId) {
                editorRef.current?.insertItem('inbox', data.id, data.title || data.content?.substring(0, 20));
                setSourceBlockId(null);
            }
        }
    });

    const updateIconMutation = useMutation({
        mutationFn: async (icon: string) => {
            const { error } = await supabase
                .from("projects")
                .update({ avatar_emoji: icon })
                .eq("id", id as string);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", id] });
            toast({ title: "Ícone atualizado" });
        }
    });


    const convertInboxToTaskMutation = useMutation({
        mutationFn: async (item: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: cols } = await supabase
                .from("kanban_columns")
                .select("id")
                .eq("project_id", id)
                .order("position", { ascending: true })
                .limit(1);

            const columnId = cols?.[0]?.id || 'todo';

            const { error: taskErr } = await (supabase as any).from("tasks").insert({
                project_id: id,
                user_id: user.id,
                title: item.title || "Captura convertida",
                column_id: columnId,
                progress: 0,
                priority: "medium",
                created_at: new Date().toISOString()
            });

            if (taskErr) throw taskErr;

            const { error: delErr } = await supabase.from("inbox").delete().eq("id", item.id);
            if (delErr) throw delErr;

            return { projectId: id };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-inbox", id] });
            queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({ title: "Convertido em tarefa!", description: "O item foi movido para a lista de tarefas do projeto." });
        }
    });

    // KPI Calculations
    const kpis = useMemo(() => {
        const nextDeadline = project?.deadline ? format(new Date(project.deadline), "dd/MM/yy", { locale: ptBR }) : null;
        const now = new Date();
        const currentMonth = format(now, "yyyy-MM");

        // 1. Filter everything strictly for CURRENT PROJECT and CURRENT MONTH
        // (Queries are already project-scoped, but we filter defensively here too)
        const projectInstallments = (installments as any[]).filter(inst => inst.project_id === id);
        const projectCosts = (costs as any[]).filter(c => c.project_id === id);

        // 2. Pending for the month (Provisioned or Overdue items due in March)
        const pendingInstallments = projectInstallments
            .filter(i => (i.status === 'provisionado' || i.status === 'atrasado') && (i.due_date || "").startsWith(currentMonth))
            .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

        // 3. Extra pending revenues in month from project_costs
        const pendingManual = projectCosts
            .filter(c => (c.category === 'revenue' || c.category === 'receita_parcela') && (c.date || "").startsWith(currentMonth) && c.date > now.toISOString().split('T')[0])
            .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

        // financialBalance = Everything strictly "A Receber" this month for this project
        const financialBalance = pendingInstallments + pendingManual;

        return {
            openTasks: tasks.filter((t: any) => t.status !== 'done').length,
            pendingInbox: inboxItems.length,
            financialBalance,
            nextDeadline
        };
    }, [project, tasks, inboxItems, costs, transactions, installments, id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-[10px] font-medium tracking-tight text-muted-foreground animate-pulse ">Sincronizando Workspace Hub...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <h2 className="text-xl font-medium  tracking-tight">Projeto não encontrado</h2>
                <button onClick={() => navigate("/projetos")} className="mt-4 text-xs font-medium text-primary underline">Voltar aos workspaces</button>
            </div>
        );
    }

    return (
        <div className={cn(
            "h-full bg-background flex overflow-hidden transition-colors",
            isResizing && "cursor-col-resize select-none"
        )}>
            {/* Left Side: Main Application Surface (Header + PageNav + Editor) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <ProjectHeader
                    project={project}
                    kpis={kpis}
                    onEdit={() => setIsEditingParam(true)}
                    onDelete={() => setIsDeleting(true)}
                    onToggleDock={() => setIsDockOpen(!isDockOpen)}
                    dockOpen={isDockOpen}
                    onCreateAction={(type) => {
                        if (type === 'task') setIsAddTaskOpen(true);
                        else if (type === 'inbox') setIsAddInboxOpen(true);
                        else if (type === 'income' || type === 'expense') setIsAddCostOpen(true);
                        else if (type === 'subpage') createPageMutation.mutate();
                    }}
                    onIconChange={(icon) => updateIconMutation.mutate(icon)}
                />

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Internal Page Navigation */}
                    <PageNav
                        projectName={project.name}
                        pages={pages as Array<{ id: string; title: string }>}
                        activePageId={activePageId}
                        onSelectPage={(pageId) => setActivePageId(pageId)}
                        onAddPage={() => createPageMutation.mutate()}
                        onDeletePage={(pageId) => deletePageMutation.mutate(pageId)}
                        editorRef={editorRef}
                        editorStatus={editorStatus}
                    />

                    {/* Editor Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-300">
                        <div className="pt-6">
                            {activePageId && activePage && (
                                <div className="mb-4 px-4 sm:px-8 flex items-center gap-2 group">
                                    <input
                                        type="text"
                                        value={pageTitleLocal}
                                        onChange={(e) => handlePageTitleChange(e.target.value)}
                                        onBlur={() => {
                                            // Save immediately on blur if there's a pending debounce
                                            if (titleDebounceRef.current) {
                                                clearTimeout(titleDebounceRef.current);
                                                titleDebounceRef.current = null;
                                            }
                                            if (activePageId && pageTitleLocal !== activePage.title) {
                                                updatePageTitleMutation.mutate({ pageId: activePageId, title: pageTitleLocal });
                                            }
                                        }}
                                        className="text-3xl font-medium bg-transparent border-none outline-none focus:ring-0 p-0 w-full placeholder:opacity-20 text-foreground tracking-tight"
                                        placeholder="Título da página..."
                                    />
                                </div>
                            )}
                        </div>

                        <BlockEditor
                            ref={editorRef}
                            key={activePageId || 'main'}
                            content={activePageId ? (activePage?.content_blocks || []) : ((project as any).content_blocks || (project.description ? [{ type: 'paragraph', content: [{ type: 'text', text: project.description }] }] : []))}
                            onChange={handleContentChange}
                            onStatusChange={setEditorStatus}

                            onCommand={(cmd) => {
                                // Record that this command was triggered from editor to insert reference later
                                // For now, we use a simple flag. Tracking the exact block ID would require TipTap position tracking.
                                setSourceBlockId('editor_trigger');

                                if (cmd === 'task') {
                                    setIsAddTaskOpen(true);
                                } else if (cmd === 'inbox') {
                                    setIsAddInboxOpen(true);
                                } else if (cmd === 'page' || cmd === 'subpage') {
                                    createPageMutation.mutate();
                                } else if (cmd === 'income' || cmd === 'expense') {
                                    setIsAddCostOpen(true);
                                } else if (['kanban', 'tasks', 'finance', 'inboxview'].includes(cmd)) {
                                    // Handle view embedding placeholder
                                    editorRef.current?.insertItem('view', cmd, cmd);
                                    setSourceBlockId(null);
                                }
                            }}
                        />
                    </div>
                </main>
            </div>

            {/* Right Side: Context Dock Layout */}
            {isDockOpen && (
                <>
                    <div
                        onMouseDown={startResizing}
                        className={cn(
                            "w-px hover:w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-all z-20 relative flex items-center justify-center",
                            isResizing && "bg-primary/50 w-1"
                        )}
                        style={{ right: 0 }} // Simplified for flex-row layout
                    >
                        <div className="w-px h-12 bg-border/80 rounded-full" />
                    </div>

                    <div
                        className="h-full bg-card transition-all duration-300 relative z-10"
                        style={{ width: sidebarWidth }}
                    >
                        <ProjectDock
                            project={project}
                            client={clientData}
                            tasks={tasks}
                            inbox={inboxItems}
                            finance={costs}
                            documents={documents}
                            pages={pages}
                            activities={activities}
                            isOpen={isDockOpen}
                            onClose={() => setIsDockOpen(false)}
                            onConvertInboxToTask={(item) => convertInboxToTaskMutation.mutate(item)}
                            onCreateItem={(type) => {
                                if (type === 'task') setIsAddTaskOpen(true);
                                if (type === 'inbox') setIsAddInboxOpen(true);
                                if (type === 'finance') setIsAddCostOpen(true);
                                if (type === 'doc') {
                                    setSelectedDocCategory("ANEXO");
                                    setIsAddingDoc(true);
                                }
                            }}
                            onSelectPage={setActivePageId}
                            onAddPage={() => createPageMutation.mutate()}
                            onInsertReference={(type, itemId) => {
                                let title = "";
                                if (type === 'task') title = tasks.find((t: any) => t.id === itemId)?.title;
                                else if (type === 'inbox') title = inboxItems.find((i: any) => i.id === itemId)?.title || inboxItems.find((i: any) => i.id === itemId)?.content?.substring(0, 20);
                                else if (type === 'page') title = pages.find((p: any) => p.id === itemId)?.title;
                                else if (type === 'doc') title = documents.find((d: any) => d.id === itemId)?.name;

                                editorRef.current?.insertItem(type as any, itemId, title);
                            }}
                            mode="sidebar"
                            style={{ width: '100%' }}
                        />
                    </div>
                </>
            )}

            {/* Dialogs */}
            <EditProjectDialog
                open={isEditingParam}
                onOpenChange={setIsEditingParam}
                project={project as any}
            />

            <DeleteConfirmDialog
                open={isDeleting}
                onOpenChange={setIsDeleting}
                onConfirm={handleDeleteProject}
                title="Excluir Projeto"
                description="Tem certeza? Isso apagará todos os dados, tarefas e documentos associados."
            />

            <AddDocumentDialog
                open={isAddingDoc}
                onOpenChange={setIsAddingDoc}
                category={selectedDocCategory}
                onConfirm={async (name, url) => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await (supabase as any).from("project_documents").insert({
                        name,
                        category: selectedDocCategory,
                        file_url: url,
                        project_id: id,
                        user_id: user.id
                    });
                    queryClient.invalidateQueries({ queryKey: ["project-documents", id] });
                    setIsAddingDoc(false);
                }}
            />

            <NewTaskDialog
                open={isAddTaskOpen}
                onOpenChange={setIsAddTaskOpen}
                projects={[{ id: project.id, name: project.name }]}
                onCreate={(values) => {
                    createTaskMutation.mutate(values);
                    setIsAddTaskOpen(false);
                }}
            />

            <AddInboxDialog
                open={isAddInboxOpen}
                onOpenChange={setIsAddInboxOpen}
                projectId={project.id}
                onConfirm={(item) => {
                    if (sourceBlockId) {
                        editorRef.current?.insertItem('inbox', item.id, item.title || item.content?.substring(0, 20));
                        setSourceBlockId(null);
                    }
                }}
            />

            <CostRegistrationDialog
                open={isAddCostOpen}
                onOpenChange={setIsAddCostOpen}
                defaultProjectId={id}
            />

        </div >
    );
};

export default ProjetoHub;

