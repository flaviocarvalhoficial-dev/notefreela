
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("🚀 Iniciando migração de descrições para blocos...");

    const { data: projects, error: fetchError } = await supabase
        .from('projects')
        .select('id, description, content_blocks');

    if (fetchError) {
        console.error("Erro ao buscar projetos:", fetchError);
        return;
    }

    console.log(`Encontrados ${projects?.length} projetos.`);

    for (const project of (projects || [])) {
        // Se já tem content_blocks e não é uma lista vazia, pula
        if (project.content_blocks && Array.isArray(project.content_blocks) && project.content_blocks.length > 0) {
            console.log(`Skipping project ${project.id} (já possui blocos)`);
            continue;
        }

        if (!project.description) {
            console.log(`Skipping project ${project.id} (sem descrição)`);
            continue;
        }

        // Converter descrição plain text para formato TipTap JSON
        const contentBlocks = {
            type: 'doc',
            content: project.description.split('\n').filter((p: string) => p.trim() !== '').map((p: string) => ({
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: p
                    }
                ]
            }))
        };

        const { error: updateError } = await supabase
            .from('projects')
            .update({ content_blocks: contentBlocks } as any)
            .eq('id', project.id);

        if (updateError) {
            console.error(`Erro ao atualizar projeto ${project.id}:`, updateError);
        } else {
            console.log(`✅ Projeto ${project.id} migrado com sucesso.`);
        }
    }

    console.log("🏁 Migração concluída.");
}

migrate();
