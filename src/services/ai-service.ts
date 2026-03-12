import { supabase } from "@/integrations/supabase";

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIResponse {
    choices: {
        message: Message;
    }[];
}

export const aiService = {
    async ask(messages: Message[], context?: any): Promise<Message> {
        try {
            const { data, error } = await supabase.functions.invoke('openai-helper', {
                body: { messages, context },
            });

            if (error) throw error;

            // If the function returns the OpenAI response structure
            if (data?.choices?.[0]?.message) {
                return data.choices[0].message;
            }

            throw new Error('Resposta da IA inválida');
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }
};
