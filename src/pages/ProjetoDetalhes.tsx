import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useProjectMutations } from "@/hooks/use-project-mutations";
import { useInboxMutations } from "@/hooks/use-inbox-mutations";
import { useProjectHubData } from "@/hooks/use-project-hub-data";
import { useProjectPages } from "@/hooks/use-project-pages";
import { useProjectKpis } from "@/hooks/use-project-kpis";
import { useSidebarResize } from "@/hooks/use-sidebar-resize";
import { ProjectHeader } from "@/components/project-hub/ProjectHeader";
import { BlockEditor } from "@/components/project-hub/BlockEditor";
import { ProjectDock } from "@/components/project-hub/ProjectDock";
import { PageNav } from "@/components/project-hub/PageNav";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { AddDocumentDialog } from "@/components/projects/AddDocumentDialog";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { CostRegistrationDialog } from "@/components/dashboard/CostRegistrationDialog";
import { AddInboxDialog } from "@/components/project-hub/AddInboxDialog";
import { type BlockEditorRef } from "@/components/project-hub/BlockEditor";
import { ViewSwitcher, ViewOption } from "@/components/shared/ViewSwitcher";
import { FileText, Kanban, DollarSign, FolderOpen, History } from "lucide-react";
import Financeiro from "./Financeiro";
import Tarefas from "./Tarefas";
import Atividades from "./Atividades";
import Documentos from "./Documentos";
import { ScrollArea } from "@/components/ui/scroll-area";

const ProjetoDetalhes = () => {
    const { id } = useParams<{ id: string }>();
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
    const [activeTab, setActiveTab] = useState("planejamento");

    const editorRef = useRef<BlockEditorRef>(null);
    const [editorStatus, setEditorStatus] = useState({
        hasColumns: false,
        canUndo: false,
        canRedo: false
    });

    const [pageTitleLocal, setPageTitleLocal] = useState("");
    const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Data Hooks
    const {
        project,
        tasks,
        inboxItems,
        costs,
        installments,
        isLoading,
        clientData,
        activities,
        documents
    } = useProjectHubData(id);

    const {
        pages,
        createPage,
        deletePage,
        updatePageTitle,
        updateContent
    } = useProjectPages(id || "");

    const { sidebarWidth, isResizing, startResizing } = useSidebarResize(window.innerWidth * 0.3);

    const kpis = useProjectKpis({
        projectId: id || "",
        project,
        tasks,
        inboxItems,
        costs,
        installments
    });

    const { createTask, deleteProject, updateIcon } = useProjectMutations();
    const { convertInboxToTask } = useInboxMutations();

    const activePage = useMemo(() => {
        if (!activePageId) return null;
        return pages?.find((p: any) => p.id === activePageId);
    }, [pages, activePageId]);

    // Sync local title
    useEffect(() => {
        if (activePage) {
            setPageTitleLocal(activePage.title || "");
        } else {
            setPageTitleLocal("");
        }
    }, [activePageId, activePage?.title]);

    const handlePageTitleChange = useCallback((newTitle: string) => {
        setPageTitleLocal(newTitle);
        if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);

        const currentPageId = activePageId;
        if (!currentPageId) return;

        titleDebounceRef.current = setTimeout(() => {
            updatePageTitle({ pageId: currentPageId, title: newTitle });
        }, 500);
    }, [activePageId, updatePageTitle]);

    const handleContentChange = useCallback((json: any) => {
        if (!activePageId && !project) return;

        if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);

        contentDebounceRef.current = setTimeout(() => {
            updateContent({
                pageId: activePageId, // if null, it updates the main project content
                contentBlocks: json
            });
        }, 1000);
    }, [activePageId, project, updateContent]);

    const handleDeleteProject = async () => {
        if (!id) return;
        try {
            await deleteProject(id);
            navigate("/projetos");
        } catch (error) {
            console.error("Erro ao excluir projeto:", error);
            toast({ variant: "destructive", title: "Erro ao excluir projeto" });
        }
    };

    // Cleanup debounce
    useEffect(() => {
        return () => {
            if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
            if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-[10px] font-medium tracking-tight text-muted-foreground animate-pulse">Sincronizando Workspace Hub...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-background">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h2 className="text-xl font-medium tracking-tight text-foreground mb-2">Projeto não encontrado</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">O link pode estar quebrado ou você não tem permissão para acessar este projeto.</p>
                <button
                    onClick={() => navigate("/projetos")}
                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-glow-sm"
                >
                    Voltar aos workspaces
                </button>
            </div>
        );
    }

    return (
        <div className={cn(
            "h-full bg-background flex overflow-hidden transition-colors",
            isResizing && "cursor-col-resize select-none"
        )}>
            {/* Left Side: Main Application Surface */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <ProjectHeader
                    project={project}
                    kpis={kpis}
                    onEdit={() => setIsEditingParam(true)}
                    onDelete={() => setIsDeleting(true)}
                    onToggleDock={() => setIsDockOpen(!isDockOpen)}
                    dockOpen={isDockOpen}
                    activeView={activeTab}
                    onViewChange={setActiveTab}
                    onIconChange={(icon) => id && updateIcon({ id, icon })}
                />

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {activeTab === 'planejamento' && (
                        <>
                            <PageNav
                                projectName={project.name}
                                pages={pages as Array<{ id: string; title: string }>}
                                activePageId={activePageId}
                                onSelectPage={(pageId) => setActivePageId(pageId)}
                                onAddPage={() => createPage()}
                                onDeletePage={(pageId) => deletePage(pageId)}
                                editorRef={editorRef}
                                editorStatus={editorStatus}
                            />

                            <div className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 bg-background/30">
                                <div className="max-w-4xl mx-auto w-full px-6 sm:px-12 py-10">
                                    {activePageId && activePage && (
                                        <div className="mb-8 group">
                                            <input
                                                type="text"
                                                value={pageTitleLocal}
                                                onChange={(e) => handlePageTitleChange(e.target.value)}
                                                onBlur={() => {
                                                    if (titleDebounceRef.current) {
                                                        clearTimeout(titleDebounceRef.current);
                                                        titleDebounceRef.current = null;
                                                    }
                                                    if (activePageId && pageTitleLocal !== activePage.title) {
                                                        updatePageTitle({ pageId: activePageId, title: pageTitleLocal });
                                                    }
                                                }}
                                                className="text-4xl font-medium bg-transparent border-none outline-none focus:ring-0 p-0 w-full placeholder:opacity-20 text-foreground/90 tracking-tight"
                                                placeholder="Título da página..."
                                            />
                                        </div>
                                    )}

                                    <BlockEditor
                                        ref={editorRef}
                                        key={activePageId || 'main'}
                                        content={activePageId ? (activePage?.content_blocks || []) : ((project as any).content_blocks || (project.description ? [{ type: 'paragraph', content: [{ type: 'text', text: project.description }] }] : []))}
                                        onChange={handleContentChange}
                                        onStatusChange={setEditorStatus}
                                        onCommand={(cmd) => {
                                            setSourceBlockId('editor_trigger');
                                            if (cmd === 'task') setIsAddTaskOpen(true);
                                            else if (cmd === 'inbox') setIsAddInboxOpen(true);
                                            else if (cmd === 'page' || cmd === 'subpage') createPage();
                                            else if (cmd === 'income' || cmd === 'expense') setIsAddCostOpen(true);
                                            else if (['kanban', 'tasks', 'finance', 'inboxview'].includes(cmd)) {
                                                editorRef.current?.insertItem('view', cmd, cmd);
                                                setSourceBlockId(null);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'producao' && (
                        <div className="flex-1 overflow-hidden">
                            <Tarefas hideHeader={true} projectId={id} />
                        </div>
                    )}

                    {activeTab === 'financeiro' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <Financeiro hideHeader={true} projectId={id} />
                        </div>
                    )}

                    {activeTab === 'arquivos' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <Documentos hideHeader={true} projectId={id} />
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <Atividades hideHeader={true} projectId={id} />
                        </div>
                    )}
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
                    >
                        <div className="w-px h-12 bg-border/80 rounded-full" />
                    </div>

                    <div
                        className="h-full bg-card transition-all duration-300 relative z-10 shadow-xl"
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
                            parentTab={activeTab}
                            onConvertInboxToTask={(item) => id && convertInboxToTask({ item, project_id: id })}
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
                            onAddPage={() => createPage()}
                            onInsertReference={(type, itemId) => {
                                let title = "";
                                if (type === 'task') title = tasks?.find((t: any) => t.id === itemId)?.title;
                                else if (type === 'inbox') title = inboxItems?.find((i: any) => i.id === itemId)?.title || inboxItems?.find((i: any) => i.id === itemId)?.content?.substring(0, 20);
                                else if (type === 'page') title = pages?.find((p: any) => p.id === itemId)?.title;
                                else if (type === 'doc') title = documents?.find((d: any) => d.id === itemId)?.name;

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
                    if (!user || !id) return;
                    await supabase.from("project_documents" as any).insert({
                        name,
                        category: selectedDocCategory,
                        file_url: url,
                        project_id: id,
                        user_id: user.id
                    } as any);
                    queryClient.invalidateQueries({ queryKey: ["project-documents", id] });
                    setIsAddingDoc(false);
                }}
            />

            <NewTaskDialog
                open={isAddTaskOpen}
                onOpenChange={setIsAddTaskOpen}
                projects={[{ id: project.id, name: project.name }]}
                onCreate={(values) => {
                    if (!id) return;
                    createTask({
                        title: values.title,
                        project_id: id,
                        priority: values.priority,
                        due_date: values.due?.toISOString(),
                        assignee: values.assignee
                    });
                    setIsAddTaskOpen(false);
                }}
            />

            <AddInboxDialog
                open={isAddInboxOpen}
                onOpenChange={setIsAddInboxOpen}
                projectId={project.id}
                onConfirm={async (item) => {
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

export default ProjetoDetalhes;
