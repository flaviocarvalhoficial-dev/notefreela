import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
        const { messages, context } = await req.json()
        const openAiKey = Deno.env.get('OPENAI_API_KEY')

        if (!openAiKey) {
            throw new Error('OPENAI_API_KEY is not set')
        }

        // Prepare content with context injection if provided
        let systemPrompt = "Você é o Nimbus Partner, o assistente inteligênte do Cockpit Nimbus. Sua missão é ajudar freelancers de elite com tarefas, organização estratégica e insights de negócio. Seja direto, afiado, organizado e use um tom profissional e sofisticado. Cor da marca: Azul Vibrante (#0080FF) com acentos em Cinza Chumbo/Slate. "

        if (context) {
            systemPrompt += `\n\nContexto Atual:\n${JSON.stringify(context)}`
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
            }),
        })

        const data = await response.json()
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
