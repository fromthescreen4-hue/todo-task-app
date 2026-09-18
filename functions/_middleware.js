export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If request path starts with /api, ensure CORS preflight options pass
  if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
    if (context.request.method === 'OPTIONS') {
      const reqOrigin = context.request.headers.get('Origin') || '*';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': reqOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
        }
      });
    }
  }

  return context.next();
}
