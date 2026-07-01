export async function onRequestGet({ request }) {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
    
    if (!query) {
        return new Response(JSON.stringify({ error: "Missing query parameter 'q'" }), { status: 400, headers });
    }

    try {
        const res = await fetch(`https://anitaku.pe/search.html?keyword=${encodeURIComponent(query)}`);
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
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
