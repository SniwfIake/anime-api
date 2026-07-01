export async function onRequestGet({ request }) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
    
    if (!id) {
        return new Response(JSON.stringify({ error: "Missing episode id" }), { status: 400, headers });
    }

    try {
        const res = await fetch(`https://anitaku.pe/${id}`);
        const html = await res.text();
        
        const iframeMatch = html.match(/<iframe src="([^"]+)"/);
        if (!iframeMatch) return new Response(JSON.stringify({ error: "Stream not found" }), { status: 404, headers });
        
        let streamUrl = iframeMatch[1];
        if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;

        return new Response(JSON.stringify({ 
            embed: streamUrl,
            message: "This is the embed URL. For raw m3u8, you need AES decryption."
        }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
