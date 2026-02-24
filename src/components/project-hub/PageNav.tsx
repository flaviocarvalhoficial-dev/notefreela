import { cn } from "@/lib/utils";
import {
    FileText, FilePlus, ChevronRight, Home,
    MoreHorizontal, Trash2, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageNavProps {
    projectName: string;
    pages: Array<{ id: string; title: string }>;
    activePageId: string | null;
    onSelectPage: (pageId: string | null) => void;
    onAddPage: () => void;
    onDeletePage?: (pageId: string) => void;
}

export const PageNav = ({
    projectName,
    pages,
    activePageId,
    onSelectPage,
    onAddPage,
    onDeletePage,
}: PageNavProps) => {
    const activePage = pages.find((p) => p.id === activePageId);

    return (
        <div className="w-full border-b border-border bg-card/20 backdrop-blur-sm">
            <div className="max-w-4xl px-4 sm:px-8 py-0">
                {/* Breadcrumb Row */}
                <div className="flex items-center gap-1.5 py-2.5 text-[11px]">
                    <button
                        onClick={() => onSelectPage(null)}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors font-medium",
                            !activePageId
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Home className="h-3 w-3" />
                        <span className="max-w-[140px] truncate">{projectName}</span>
                    </button>

                    {activePageId && activePage && (
                        <>
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                                <FileText className="h-3 w-3" />
                                <span className="max-w-[180px] truncate">
                                    {activePage.title || "Sem título"}
                                </span>
                            </span>
                        </>
                    )}
                </div>

                {/* Page Tree — horizontal tab-style */}
                {pages.length > 0 && (
                    <div className="flex items-center gap-0.5 pb-1 overflow-x-auto scrollbar-none -mx-1 px-1">
                        {/* Main page indicator */}
                        <button
                            onClick={() => onSelectPage(null)}
                            className={cn(
                                "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all shrink-0",
                                !activePageId
                                    ? "bg-foreground/10 text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                            )}
                        >
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                !activePageId ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                            )} />
                            Página Principal
                        </button>

                        {/* Connector line */}
                        <div className="w-3 h-px bg-border shrink-0" />

                        {/* Sub-pages */}
                        {pages.map((page, index) => (
                            <div key={page.id} className="flex items-center shrink-0">
                                {index > 0 && (
                                    <div className="w-1 h-px bg-border shrink-0" />
                                )}
                                <div className="group relative flex items-center">
                                    <button
                                        onClick={() => onSelectPage(page.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                                            activePageId === page.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-1 h-1 rounded-full transition-colors",
                                            activePageId === page.id
                                                ? "bg-primary"
                                                : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                                        )} />
                                        <span className="max-w-[120px] truncate">
                                            {page.title || "Sem título"}
                                        </span>
                                    </button>

                                    {/* Context menu */}
                                    {onDeletePage && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted/40 rounded transition-all ml-0.5">
                                                    <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-36">
                                                <DropdownMenuItem
                                                    onClick={() => onDeletePage(page.id)}
                                                    className="text-destructive text-xs"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add page button */}
                        <div className="w-2 h-px bg-border shrink-0" />
                        <button
                            onClick={onAddPage}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                            title="Nova página"
                        >
                            <FilePlus className="h-3 w-3" />
                        </button>
                    </div>
                )}

                {/* Empty state — no sub-pages yet */}
                {pages.length === 0 && (
                    <div className="flex items-center gap-2 pb-2">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full bg-primary"
                        )} />
                        <span className="text-[10px] font-semibold text-foreground">Página Principal</span>
                        <div className="w-3 h-px bg-border" />
                        <button
                            onClick={onAddPage}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                        >
                            <FilePlus className="h-3 w-3" />
                            <span>Adicionar Página</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

