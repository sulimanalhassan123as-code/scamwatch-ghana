// Vercel Serverless Function — Proxies API requests to backend
// This hides the real backend URL from the client

const BACKEND_URL = 'https://solas-39a02ff5.base44.app/functions';

export default async function handler(req, res) {
  // Only allow POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get the endpoint from the path after /api/
  const endpoint = req.url.replace('/api/', '').replace('/api', '');
  const targetUrl = endpoint ? `${BACKEND_URL}/${endpoint}` : BACKEND_URL;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
