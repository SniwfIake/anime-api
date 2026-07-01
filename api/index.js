export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            });
        }
        
        const headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        };

        const path = url.pathname;
        const BASE_URL = "https://anitaku.pe";

        try {
            if (path === "/api/search") {
                const query = url.searchParams.get('q');
                if (!query) return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers });
                
                const res = await fetch(`${BASE_URL}/search.html?keyword=${encodeURIComponent(query)}`);
                const html = await res.text();
                
                const results = [];
                const regex = /<p class="name"><a href="\/category\/([^"]+)" title="([^"]+)">/g;
                const imgRegex = /<img src="([^"]+)" alt="/g;
                
                let match; let imgMatch;
                while ((match = regex.exec(html)) !== null) {
                    imgMatch = imgRegex.exec(html);
                    results.push({
                        id: match[1],
                        title: match[2],
                        image: imgMatch ? imgMatch[1] : null
                    });
                }
                return new Response(JSON.stringify({ results }), { headers });
            }
            
            if (path === "/api/info") {
                const id = url.searchParams.get('id');
                if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers });
                
                const res = await fetch(`${BASE_URL}/category/${id}`);
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
                    episodes.push({
                        id: epMatch[1].trim().replace('/', ''), 
                        number: epMatch[2].replace('EP', '').trim()
                    });
                }
                
                return new Response(JSON.stringify({ id, episodes: episodes.reverse() }), { headers });
            }
            
            if (path === "/api/watch") {
                const id = url.searchParams.get('id');
                if (!id) return new Response(JSON.stringify({ error: "Missing episode id" }), { status: 400, headers });
                
                const res = await fetch(`${BASE_URL}/${id}`);
                const html = await res.text();
                
                const iframeMatch = html.match(/<iframe src="([^"]+)"/);
                if (!iframeMatch) return new Response(JSON.stringify({ error: "Stream not found" }), { status: 404, headers });
                
                let streamUrl = iframeMatch[1];
                if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;
                
                return new Response(JSON.stringify({ 
                    embed: streamUrl
                }), { headers });
            }
            
            return new Response(JSON.stringify({ error: "Endpoint not found. Valid endpoints are /api/search, /api/info, /api/watch" }), { status: 404, headers });
            
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }
};
