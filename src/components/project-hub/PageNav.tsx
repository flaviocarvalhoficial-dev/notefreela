import { cn } from "@/lib/utils";
import React from "react";
import {
    FileText, ChevronRight, Home,
    Undo, Redo, Columns2, LayoutGrid, Trash2
} from "lucide-react";

interface PageNavProps {
    projectName: string;
    pages: Array<{ id: string; title: string }>;
    activePageId: string | null;
    onSelectPage: (pageId: string | null) => void;
    onAddPage: () => void;
    onDeletePage?: (pageId: string) => void;
    editorRef?: React.RefObject<any>;
    editorStatus?: { hasColumns: boolean; canUndo: boolean; canRedo: boolean };
}

export const PageNav = ({
    projectName,
    pages,
    activePageId,
    onSelectPage,
    editorRef,
    editorStatus
}: PageNavProps) => {
    const activePage = pages.find((p) => p.id === activePageId);

    return (
        <div className="w-full border-b border-border bg-card/20 backdrop-blur-sm px-2 sm:px-4">
            <div className="w-full py-0">
                {/* Single Row: Breadcrumb & Editor Actions */}
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-1.5 text-[11px]">
                        {!activePageId ? (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 text-muted-foreground/60 font-medium">
                                <LayoutGrid className="h-3 w-3" />
                                Visão Geral
                            </span>
                        ) : (
                            <button
                                onClick={() => onSelectPage(null)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors font-medium"
                            >
                                <ChevronRight className="h-3 w-3 rotate-180" />
                                Voltar ao Planejamento
                            </button>
                        )}

                        {activePageId && activePage && (
                            <>
                                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-foreground/90 font-medium">
                                    <FileText className="h-3 w-3" />
                                    <span className="max-w-[180px] truncate">
                                        {activePage.title || "Sem título"}
                                    </span>
                                </span>
                            </>
                        )}
                    </div>

                    {/* Editor Actions (Right Aligned) */}
                    {editorRef?.current && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => editorRef?.current?.undo()}
                                    disabled={!editorStatus?.canUndo}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-20 transition-all"
                                    title="Desfazer (Ctrl+Z)"
                                >
                                    <Undo className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => editorRef?.current?.redo()}
                                    disabled={!editorStatus?.canRedo}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-20 transition-all"
                                    title="Refazer (Ctrl+Y)"
                                >
                                    <Redo className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="w-px h-4 bg-border/60" />

                            <div className="flex items-center gap-1">
                                {editorStatus?.hasColumns ? (
                                    <button
                                        onClick={() => editorRef?.current?.removeColumns()}
                                        className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-all"
                                        title="Remover Colunas"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => editorRef.current.insertColumns(2)}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                            title="Layout 2 Colunas"
                                        >
                                            <Columns2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => editorRef.current.insertColumns(3)}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                            title="Layout 3 Colunas"
                                        >
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
