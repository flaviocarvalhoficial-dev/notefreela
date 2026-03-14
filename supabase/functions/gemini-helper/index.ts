import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt: rawPrompt, messages, context, history: rawHistory } = await req.json()
        const geminiKey = Deno.env.get('GEMINI_API_KEY')

        if (!geminiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY is not set in Supabase Edge Functions' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Helper to format context in a hyper-readable way for LLM
        const formatContext = (ctx: any) => {
            if (!ctx) return "Nenhum dado do workspace disponível no momento.";

            let summary = "--- DADOS ATUAIS DO WORKSPACE ---\n";

            if (ctx.global_overview) {
                const glob = ctx.global_overview;
                summary += `RESUMO GERAL:\n`;
                summary += `- Projetos Ativos: ${glob.active_projects}\n`;
                summary += `- Total de Projetos: ${glob.total_projects}\n`;
                summary += `- Leads Totais: ${glob.total_leads}\n`;
                summary += `- Clientes: ${glob.total_clients}\n`;
                summary += `- Valor Total em Projetos: R$ ${glob.total_project_value.toLocaleString('pt-BR')}\n`;
                summary += `- Ticket Médio: R$ ${glob.average_ticket.toLocaleString('pt-BR')}\n`;
                summary += `- Tarefas Concluídas: ${glob.tasks_completed} de ${glob.tasks_total}\n`;
                summary += `- Leads Recentes: ${glob.recent_leads?.join(', ') || 'Nenhum'}\n\n`;
            }

            if (ctx.is_project_context && ctx.project) {
                summary += `CONTEXTO DO PROJETO ATUAL (${ctx.project.name}):\n`;
                summary += `- Status: ${ctx.project.status}\n`;
                summary += `- Cliente: ${ctx.project.client}\n`;
                summary += `- Valor: R$ ${Number(ctx.project.value).toLocaleString('pt-BR')}\n`;
                summary += `- Prazo: ${ctx.project.deadline || 'Não definido'}\n`;
                summary += `- Descrição: ${ctx.project.description || 'Sem descrição'}\n`;

                if (ctx.tasks && ctx.tasks.length > 0) {
                    summary += `- Tarefas (${ctx.tasks.length}):\n`;
                    ctx.tasks.forEach((t: any) => {
                        summary += `  * [${t.column_id}] ${t.title} (Prioridade: ${t.priority}, Progresso: ${t.progress}%)\n`;
                    });
                }
                summary += '\n';
            }

            summary += `ESTADO DA NAVEGAÇÃO:\n- Página Atual: ${ctx.path}\n`;

            return summary;
        };

        const contextSummary = formatContext(context);

        // Build the system prompt with persona and context
        let systemPrompt = `Você é o Nimbus Partner, o copiloto de inteligência e operação do Nimbus (um sistema operacional para freelancers).

DIRETRIZES DE PERSONA:
1. Você tem ACESSO TOTAL aos dados do workspace fornecidos abaixo.
2. Nunca diga que não tem acesso a informações em tempo real se os dados estiverem no contexto.
3. Use os números abaixo para responder perguntas sobre projetos, leads, clientes e financeiro.
4. Seja estratégico: se o usuário perguntar "como estamos?", analise o faturamento, leads e progresso de tarefas.
5. Seja direto, sofisticado e profissional. Use Português do Brasil (PT-BR).

${contextSummary}

Sua missão é atuar como o braço direito do freelancer, ajudando a tomar decisões baseadas nesses dados.
`

        // Extract prompt and history from messages if provided
        let prompt = rawPrompt
        let history = rawHistory || []

        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            prompt = lastMessage.content

            // Convert previous messages to history
            history = messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        }

        // Start chat session
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Sou o Nimbus Partner, seu copiloto de operação. Tenho acesso aos dados do seu workspace e estou pronto para analisá-los e ajudá-lo na gestão estratégica." }],
                },
                ...history
            ],
        })

        const result = await chat.sendMessage(prompt)
        const response = await result.response
        const text = response.text()

        return new Response(JSON.stringify({
            text,
            choices: [{ message: { role: 'assistant', content: text } }]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Error in gemini-helper execution:', {
            message: error.message,
            stack: error.stack,
            type: typeof error
        });

        return new Response(JSON.stringify({
            error: error.message,
            details: "Certifique-se de que a GEMINI_API_KEY está configurada nos Secrets do Supabase."
        }), {
            status: error.message?.includes('GEMINI_API_KEY') ? 500 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
});
