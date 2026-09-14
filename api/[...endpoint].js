// Vercel Serverless Function — Catch-all API proxy
// Hides the real backend URL from client-side code
// Any request to /api/* is proxied to the backend

// Backend URL kept in Vercel env vars (BACKEND_URL) — never hardcoded in public code
const BACKEND_URL = process.env.BACKEND_URL;

export default async function handler(req, res) {
  // Only allow POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract endpoint from the request path (works on all Vercel build paths)
  // Some build paths do not inject the [...endpoint] query param, so parse req.url.
  let rawUrl = req.url || '';
  let pathOnly = rawUrl.split('?')[0];
  let endpoint = '';
  if (pathOnly.startsWith('/api/')) {
    endpoint = pathOnly.slice(5);
  } else if (pathOnly.startsWith('/') && pathOnly.length > 1) {
    endpoint = pathOnly.slice(1);
  }
  if (!endpoint && req.query.endpoint) {
    endpoint = Array.isArray(req.query.endpoint) ? req.query.endpoint.join('/') : String(req.query.endpoint);
  }
  
  // Build target URL
  let targetUrl = BACKEND_URL;
  if (endpoint) {
    targetUrl = `${BACKEND_URL}/${endpoint}`;
  }
  
  // Append any query string from original request
  if (rawUrl.includes('?')) {
    const queryString = rawUrl.split('?')[1];
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
