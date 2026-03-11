import { cn } from "@/lib/utils";
import React from "react";
import {
    FileText, ChevronRight, Home,
    Undo, Redo, Columns2, LayoutGrid, Plus, X
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
    onAddPage,
    onDeletePage,
    editorRef,
    editorStatus
}: PageNavProps) => {
    return (
        <div className="w-full border-b border-border bg-card/20 backdrop-blur-sm px-2 sm:px-4">
            <div className="w-full py-0">
                {/* Single Row: Breadcrumb & Editor Actions */}
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1 px-1 overflow-x-auto no-scrollbar">
                            {pages.map((page) => (
                                <div key={page.id} className="relative group/page-chip flex items-center">
                                    <button
                                        onClick={() => onSelectPage(page.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 pr-7 rounded-md transition-all font-medium whitespace-nowrap",
                                            activePageId === page.id
                                                ? "bg-muted text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                        )}
                                    >
                                        <FileText className="h-3 w-3 opacity-60" />
                                        <span className="max-w-[120px] truncate">{page.title || "Sem título"}</span>
                                    </button>

                                    {onDeletePage && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Excluir página "${page.title}"?`)) {
                                                    onDeletePage(page.id);
                                                }
                                            }}
                                            className="absolute right-1 opacity-0 group-hover/page-chip:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                            title="Excluir página"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={onAddPage}
                                className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all ml-1"
                                title="Nova página"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
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
                                    <div />
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
