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
            const { data, error } = await supabase.functions.invoke("gemini-helper", {
                body: { messages, context },
            });

            if (error) throw error;

            console.log("AI response:", data);

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