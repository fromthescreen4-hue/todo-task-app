export async function onRequest(context) {
  const reqOrigin = context.request.headers.get('Origin') || '*';
  return new Response(JSON.stringify({
    ok: true,
    service: 'todo-task-app-api',
    status: 'ok',
    version: '2.0.0-prod',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': reqOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
    }
  });
}
