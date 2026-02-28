// Script para criar a tabela time_entries no Supabase do NoteFreela
// Execute: node scripts/run-migration.js

const SUPABASE_URL = 'https://ssyoxcauvzqqqiobmwkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeW94Y2F1dnpxcXFpb2Jtd2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTM5MzgsImV4cCI6MjA4NTM2OTkzOH0.DkFwnJ7TGcT0jh9X3rc2QdBF-FFtQKPXK1x1fsPmMpM';

// Test connection - check if table exists
async function checkTable() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?limit=1`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
    });

    if (res.status === 200 || res.status === 204) {
        console.log('✅ Tabela time_entries já existe!');
        return true;
    }

    const body = await res.text();
    if (body.includes('does not exist') || body.includes('undefined')) {
        console.log('❌ Tabela time_entries NÃO existe - execute a migração manualmente no Supabase Dashboard.');
        console.log('');
        console.log('SQL para executar no Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/ssyoxcauvzqqqiobmwkz/sql');
        console.log('');
        console.log('Cole o conteúdo de migration-time-entries.sql');
        return false;
    }

    console.log('Status:', res.status, body.substring(0, 200));
    return false;
}

checkTable();
