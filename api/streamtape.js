export default async function handler(req, res) {
    // Set CORS headers so it works both on localhost and production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    const stLogin = process.env.VITE_STREAMTAPE_LOGIN || 'aab66fe1a6ff976a21';
    const stKey = process.env.VITE_STREAMTAPE_KEY || 'QbLWlejVDqT0DVb';

    try {
        let apiUrl = '';
        if (action === 'listfolder') {
            apiUrl = `https://api.streamtape.com/file/listfolder?login=${stLogin}&key=${stKey}`;
        } else if (action === 'dlticket') {
            const { file } = req.query;
            if (!file) return res.status(400).json({ status: 400, msg: "Missing file ID" });
            apiUrl = `https://api.streamtape.com/file/dlticket?login=${stLogin}&key=${stKey}&file=${file}`;
        } else if (action === 'dl') {
            const { file, ticket } = req.query;
            if (!file || !ticket) return res.status(400).json({ status: 400, msg: "Missing file or ticket" });
            apiUrl = `https://api.streamtape.com/file/dl?file=${file}&ticket=${ticket}`;
        } else if (action === 'ul') {
            const { name } = req.query;
            apiUrl = `https://api.streamtape.com/file/ul?login=${stLogin}&key=${stKey}&name=${encodeURIComponent(name || '')}`;
        } else if (action === 'rename') {
            const { file, name } = req.query;
            if (!file || !name) return res.status(400).json({ status: 400, msg: "Missing file or name" });
            apiUrl = `https://api.streamtape.com/file/rename?login=${stLogin}&key=${stKey}&file=${file}&name=${encodeURIComponent(name)}`;
        } else if (action === 'delete') {
            const { file } = req.query;
            if (!file) return res.status(400).json({ status: 400, msg: "Missing file ID" });
            apiUrl = `https://api.streamtape.com/file/delete?login=${stLogin}&key=${stKey}&file=${file}`;
        } else {
            return res.status(400).json({ status: 400, msg: "Invalid action" });
        }

        const response = await fetch(apiUrl);
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ status: 500, msg: error.message });
    }
}
