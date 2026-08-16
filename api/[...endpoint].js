// Vercel Serverless Function — Catch-all API proxy
// Hides the real backend URL from client-side code
// Any request to /api/* is proxied to the backend

const BACKEND_URL = 'https://solas-39a02ff5.base44.app/functions';

export default async function handler(req, res) {
  // Only allow POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract endpoint from query params (Vercel catch-all route)
  const endpoint = req.query.endpoint ? req.query.endpoint.join('/') : '';
  
  // Build target URL
  let targetUrl = BACKEND_URL;
  if (endpoint) {
    targetUrl = `${BACKEND_URL}/${endpoint}`;
  }
  
  // Append any query string from original request
  if (req.url && req.url.includes('?')) {
    const queryString = req.url.split('?')[1];
    targetUrl += `?${queryString}`;
  }

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
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
