import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Bot, User, Terminal, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface AIChatMessageProps {
    role: "assistant" | "user";
    content: string;
    timestamp?: string;
    isProjectContext?: boolean;
}

export const AIChatMessage = ({ role, content, timestamp, isProjectContext }: AIChatMessageProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "mb-6 flex flex-col group",
                role === 'user' ? "items-end" : "items-start"
            )}
        >
            <div className={cn(
                "flex items-center gap-2 mb-1.5 px-1",
                role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
                <div className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center border",
                    role === 'assistant'
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-muted border-border text-muted-foreground"
                )}>
                    {role === 'assistant' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {role === 'user' ? 'Você' : 'Nimbus Partner'}
                </span>
                {timestamp && (
                    <span className="text-[9px] text-muted-foreground/30 font-medium">
                        • {timestamp}
                    </span>
                )}
            </div>

            <div className={cn(
                "max-w-[92%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all",
                role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card border border-border/60 text-foreground rounded-tl-none prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/40 prose-table:border prose-table:border-border/40 prose-th:bg-muted/30 prose-th:p-2 prose-td:p-2 prose-strong:text-primary prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded overflow-x-auto"
            )}>
                {role === "assistant" ? (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            table: ({ children }) => (
                                <div className="my-4 overflow-x-auto rounded-lg border border-border/40 bg-muted/5">
                                    <table className="w-full text-left border-collapse">
                                        {children}
                                    </table>
                                </div>
                            ),
                            th: ({ children }) => (
                                <th className="p-3 text-[11px] font-bold uppercase tracking-wider bg-muted/30 border-b border-border/40 text-muted-foreground">
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td className="p-3 border-b border-border/20 text-[12px]">
                                    {children}
                                </td>
                            ),
                            ul: ({ children }) => (
                                <ul className="space-y-1.5 my-3 list-none pl-0">
                                    {children}
                                </ul>
                            ),
                            li: ({ children }) => (
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                                    <span>{children}</span>
                                </li>
                            ),
                            code: ({ node, inline, className, children, ...props }: any) => {
                                if (inline) {
                                    return <code className="bg-primary/5 text-primary px-1 rounded font-medium" {...props}>{children}</code>;
                                }
                                return (
                                    <div className="my-4 rounded-xl border border-border/40 overflow-hidden bg-muted/20">
                                        <div className="bg-muted/40 px-3 py-1.5 border-b border-border/40 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Terminal className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Snippet</span>
                                            </div>
                                        </div>
                                        <pre className="p-4 overflow-x-auto text-[12px] font-mono leading-relaxed" {...props}>
                                            {children}
                                        </pre>
                                    </div>
                                );
                            }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                ) : (
                    content
                )}
            </div>

            {role === 'assistant' && (
                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Estilizar Resposta
                    </button>
                </div>
            )}
        </motion.div>
    );
};
