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

        // Build the system prompt with persona and context
        let systemPrompt = `Você é o Nimbus Partner, o copiloto de operação de um freelancer de elite.
Sua missão é ajudar com tarefas, organização estratégica e insights de negócio baseados nos dados do workspace.
Seja direto, profissional, estratégico e sofisticado.
Sempre responda em Português do Brasil.
A marca se chama "Nimbus".

Diretrizes:
- Use 'global_overview' para métricas gerais (financeiro, total de projetos, leads).
- Use 'project' e 'tasks' para detalhes de execução quando em contexto de projeto.
- Se os dados estiverem faltando, peça ao usuário.

Dados do Workspace:
${JSON.stringify(context || {}, null, 2)}
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
                    parts: [{ text: "Entendido. Sou o Nimbus Partner e estou pronto para agir como seu copiloto estratégico com base nos dados fornecidos." }],
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
