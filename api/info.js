export const config = { runtime: 'edge' };

export default async function handler(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
    
    if (!id) return new Response(JSON.stringify({ error: "Missing id parameter" }), { status: 400, headers });
    
    try {
        const res = await fetch(`https://anitaku.pe/category/${id}`);
        const html = await res.text();
        const movieIdMatch = html.match(/<input type="hidden" value="([^"]+)" id="movie_id"/);
        if (!movieIdMatch) return new Response(JSON.stringify({ error: "Anime not found" }), { status: 404, headers });
        const movieId = movieIdMatch[1];
        
        const epRes = await fetch(`https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=0&ep_end=9999&id=${movieId}`);
        const epHtml = await epRes.text();
        
        const episodes = [];
        const epRegex = /<a href="([^"]+)" class="[^"]+" title="[^"]+">\s*<div class="name">\s*<span>([^<]+)<\/span>/g;
        let epMatch;
        while ((epMatch = epRegex.exec(epHtml)) !== null) {
            episodes.push({ id: epMatch[1].trim().replace('/', ''), number: epMatch[2].replace('EP', '').trim() });
        }
        return new Response(JSON.stringify({ id, episodes: episodes.reverse() }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
