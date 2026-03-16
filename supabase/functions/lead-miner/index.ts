import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query, location, radius, searchId } = await req.json()

        const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!googleMapsKey || !geminiKey) {
            return new Response(
                JSON.stringify({ error: 'Configuração incompleta: API Keys não encontradas nos Secrets.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
        const genAI = new GoogleGenerativeAI(geminiKey)
        const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        console.log(`Iniciando busca real enriquecida: ${query} em ${location}`);

        const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': googleMapsKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.types,places.nationalPhoneNumber'
            },
            body: JSON.stringify({
                textQuery: `${query} em ${location}`,
                languageCode: 'pt-BR',
                maxResultCount: 8
            })
        });

        if (!placesResponse.ok) {
            const errorText = await placesResponse.text();
            return new Response(
                JSON.stringify({ error: `Google Maps API retornou erro: ${placesResponse.status}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const placesData = await placesResponse.json();
        const locations = placesData.places || [];

        const analyzedResults = await Promise.all(locations.map(async (place: any) => {
            const placeInfo = {
                name: place.displayName?.text,
                address: place.formattedAddress,
                rating: place.rating,
                reviews: place.userRatingCount,
                website: place.websiteUri,
                categories: place.types,
                phone: place.nationalPhoneNumber
            };

            const prompt = `Analise este negócio do Google Maps para um freelancer de marketing digital.
      Dados: ${JSON.stringify(placeInfo)}
      
      Sua tarefa:
      1. Identifique 2-3 necessidades críticas (ex: Sem site, SEO Local Baixo, Poucas avaliações).
      2. Tente ENCONTRAR ou ESTIMAR os links de redes sociais (Instagram, Facebook) com base no nome e site.
      3. Calcule um Score de 0-100 de quão bom lead eles são.
      
      Retorne APENAS um JSON válido no formato:
      {
        "score": number, 
        "needs": string[], 
        "instagram": "url_ou_null", 
        "facebook": "url_ou_null",
        "linkedin": "url_ou_null"
      }`;

            try {
                const result = await gemini.generateContent(prompt);
                const response = await result.response;
                const text = response.text().replace(/```json|```/g, '').trim();
                const analysis = JSON.parse(text);

                return {
                    search_id: searchId,
                    name: placeInfo.name,
                    address: placeInfo.address,
                    website: placeInfo.website,
                    phone: placeInfo.phone || null,
                    rating: placeInfo.rating,
                    reviews_count: placeInfo.reviews,
                    needs: analysis.needs || ["Melhorar presença digital"],
                    score: analysis.score || 50,
                    instagram: analysis.instagram !== "url_ou_null" ? analysis.instagram : null,
                    facebook: analysis.facebook !== "url_ou_null" ? analysis.facebook : null,
                    linkedin: analysis.linkedin !== "url_ou_null" ? analysis.linkedin : null,
                    status: 'pending'
                };
            } catch (err) {
                return {
                    search_id: searchId,
                    name: placeInfo.name,
                    address: placeInfo.address,
                    website: placeInfo.website,
                    phone: placeInfo.phone || null,
                    rating: placeInfo.rating,
                    reviews_count: placeInfo.reviews,
                    needs: ["Análise manual necessária"],
                    score: 60,
                    status: 'pending'
                };
            }
        }));

        const { data: results, error: insertError } = await supabase
            .from('growth_results')
            .insert(analyzedResults)
            .select();

        if (insertError) throw insertError;

        await supabase.from('growth_searches').update({ results_count: results.length }).eq('id', searchId);

        return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Lead Miner Error:', error.message);
        return new Response(
            JSON.stringify({ error: 'Erro ao processar leads.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
});
