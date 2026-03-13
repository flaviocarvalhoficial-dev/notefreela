import { supabase } from "@/integrations/supabase/client";

export const getGeminiResponse = async (prompt: string, context?: any, history: any[] = []) => {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-helper', {
            body: { prompt, context, history },
        });

        if (error) {
            console.error("Error calling gemini-helper function:", error);
            throw error;
        }

        return data.text || "Desculpe, não recebi uma resposta válida.";
    } catch (error) {
        console.error("Error calling AI Assistant service:", error);
        return "Desculpe, tive um problema ao processar sua solicitação via Assistente Nimbus. Verifique a conexão ou tente novamente mais tarde.";
    }
};
