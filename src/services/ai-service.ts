import { supabase } from "@/integrations/supabase";

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AIResponse {
    reply?: string;
    text?: string;
    choices?: {
        message: Message;
    }[];
}

export const aiService = {
    async ask(messages: Message[], context?: any): Promise<Message> {
        try {
            // Reinforce context in the frontend to bypass backend old versions
            const formatContextStr = (ctx: any) => {
                if (!ctx) return "";
                let str = "\n--- INSTRUÇÕES DE PERSONA ---\n";
                str += `Você é o Nimbus Partner, o braço direito estratégico do(a) ${ctx.user_name || 'Freelancer'}.\n`;
                str += "REGRAS DE COMPORTAMENTO:\n";
                str += "1. Seja CONCISO em conversas informais e saudações. Se o usuário disser 'Olá', responda apenas de forma amigável e breve.\n";
                str += "2. NÃO gere relatórios complexos ou cite dados do workspace a menos que seja PERTINENTE à pergunta ou se o usuário usar um comando (/slash).\n";
                str += "3. Comandos como /diagnostico, /radar ou /proxima EXIGEM análise profunda e estratégica.\n";
                str += "4. Aja como um parceiro em um chat: seja útil, direto e evite textos desnecessários.\n\n";

                str += "--- DADOS DE REFERÊNCIA (NÃO CITE TODOS A MENOS QUE SOLICITADO) ---\n";
                if (ctx.user_name) {
                    str += `NOME DO USUÁRIO: ${ctx.user_name}\n`;
                }
                if (ctx.global_overview) {
                    const g = ctx.global_overview;
                    str += `VISÃO GERAL: Projetos Ativos: ${g.active_projects}/${g.total_projects}, Leads: ${g.total_leads} (${g.hot_leads_count} Quentes), Clientes: ${g.total_clients}\n`;
                    str += `FINANCEIRO: Total R$ ${g.total_project_value.toLocaleString('pt-BR')}, Em Proposta: R$ ${g.pending_proposals_value.toLocaleString('pt-BR')}\n`;
                    str += `FATURAMENTO MENSAL: ${Object.entries(g.billing_by_month).map(([m, v]) => `${m}: R$ ${Number(v).toLocaleString('pt-BR')}`).join(' | ')}\n`;
                    str += `FUNIL LEADS: Novo: ${g.leads_funnel.novo}, Contato: ${g.leads_funnel.contato}, Proposta: ${g.leads_funnel.proposta}, Negociação: ${g.leads_funnel.negociacao}, Fechado: ${g.leads_funnel.fechado}\n`;
                    str += `TAREFAS: Concluídas ${g.tasks_completed}/${g.tasks_total} (Prioridade Alta: ${g.task_priority_summary.high})\n`;
                }
                if (ctx.is_project_context && ctx.project) {
                    str += `CONTEXTO DO PROJETO ATUAL: ${ctx.project.name} (Status: ${ctx.project.status}), Cliente: ${ctx.project.client}, Valor: R$ ${Number(ctx.project.value).toLocaleString('pt-BR')}\n`;
                }
                str += "---------------------------------------------------\n";
                return str;
            };

            const contextReinforcement = formatContextStr(context);

            // Create a processed version of messages for the API call
            // We use map to ensure we don't mutate the objects that React is using for UI
            const processedMessages = messages.map((m, index) => {
                if (index === messages.length - 1 && m.role === 'user' && contextReinforcement) {
                    // Deep clone and inject here
                    return { ...m, content: `${contextReinforcement}\nPergunta do usuário: ${m.content}` };
                }
                return m;
            });

            console.log("Sending reinforced context to AI (Injected in last message)");

            const { data, error } = await supabase.functions.invoke("gemini-helper", {
                body: { messages: processedMessages, context },
            });

            if (error) throw error;

            console.log("AI response received");

            if (data?.reply && typeof data.reply === "string") {
                return { role: "assistant", content: data.reply };
            }

            if (data?.text && typeof data.text === "string") {
                return { role: "assistant", content: data.text };
            }

            if (data?.choices?.[0]?.message) {
                return data.choices[0].message;
            }

            throw new Error("Resposta da IA inválida");
        } catch (error) {
            console.error("AI Service Error:", error);
            throw error;
        }
    },
};