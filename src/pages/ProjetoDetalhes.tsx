import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectHeader } from "@/components/project-hub/ProjectHeader";
import { BlockEditor } from "@/components/project-hub/BlockEditor";
import { ProjectDock } from "@/components/project-hub/ProjectDock";
import { PageNav } from "@/components/project-hub/PageNav";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { AddDocumentDialog } from "@/components/projects/AddDocumentDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    const [selectedDocCategory, setSelectedDocCategory] = useState<string>("");

    // Local page title state for smooth typing (avoids mutation per keystroke)
    const [pageTitleLocal, setPageTitleLocal] = useState("");
    const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        };
    }, []);

    const deleteProjectMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from("projects").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Projeto removido" });
            navigate("/projetos");
        }
    });

    // KPI Calculations
    const kpis = useMemo(() => {
        const nextDeadline = project?.deadline ? format(new Date(project.deadline), "dd/MM/yy", { locale: ptBR }) : null;
        const financialBalance = costs.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

        return {
            openTasks: tasks.filter((t: any) => t.status !== 'done').length,
            pendingInbox: inboxItems.length,
            financialBalance,
            nextDeadline
        };
    }, [project, tasks, inboxItems, costs]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground animate-pulse uppercase">Sincronizando Workspace Hub...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <h2 className="text-xl font-black uppercase tracking-widest">Projeto não encontrado</h2>
                <button onClick={() => navigate("/projetos")} className="mt-4 text-xs font-bold text-primary underline">VOLTAR AOS WORKSPACES</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            <ProjectHeader
                project={project}
                kpis={kpis}
                onEdit={() => setIsEditingParam(true)}
                onDelete={() => setIsDeleting(true)}
                onToggleDock={() => setIsDockOpen(!isDockOpen)}
                dockOpen={isDockOpen}
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
                />

                {/* Editor Area */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-300">
                        <div className="px-4 sm:px-8 pt-6">
                            {activePageId && activePage && (
                                <div className="mb-4 flex items-center gap-2 group">
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
                                        className="text-3xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 w-full placeholder:opacity-20 text-foreground"
                                        placeholder="Título da página..."
                                    />
                                </div>
                            )}
                        </div>

                        <BlockEditor
                            key={activePageId || 'main'}
                            content={activePageId ? (activePage?.content_blocks || []) : ((project as any).content_blocks || (project.description ? [{ type: 'paragraph', content: [{ type: 'text', text: project.description }] }] : []))}
                            onChange={(json) => updateContentMutation.mutate(json)}
                            onCommand={(cmd) => {
                                if (cmd === 'task') {
                                    toast({ title: "Modo Criar Tarefa", description: "Use o menu lateral contexto para criar." });
                                    setIsDockOpen(true);
                                } else if (cmd === 'page') {
                                    createPageMutation.mutate();
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Sliding Context Dock */}
                <ProjectDock
                    project={project}
                    tasks={tasks}
                    inbox={inboxItems}
                    finance={costs}
                    documents={documents}
                    pages={pages}
                    activities={[]}
                    isOpen={isDockOpen}
                    onClose={() => setIsDockOpen(false)}
                    onSelectPage={(pageId) => setActivePageId(pageId)}
                    onAddPage={() => createPageMutation.mutate()}
                    onCreateItem={(type) => {
                        if (type === 'doc') {
                            setSelectedDocCategory('briefing');
                            setIsAddingDoc(true);
                        } else {
                            toast({ title: "Criação Direta", description: `Ação para criar ${type} será implementada.` });
                        }
                    }}
                    onInsertReference={(type, id) => {
                        toast({ title: "Referência Inserida", description: `Item [${type}] vinculado ao documento.` });
                        console.log("Inserindo referência:", { type, id });
                    }}
                />
            </main>

            {/* Dialogs */}
            <EditProjectDialog
                open={isEditingParam}
                onOpenChange={setIsEditingParam}
                project={project as any}
            />

            <DeleteConfirmDialog
                open={isDeleting}
                onOpenChange={setIsDeleting}
                title="Excluir Hub do Projeto"
                description="Isso removerá todo o histórico e conteúdo deste workspace. Confirmar?"
                onConfirm={() => deleteProjectMutation.mutate()}
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--border) / 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--border) / 0.8);
                }
            `}</style>
        </div>
    );
};

export default ProjetoHub;
