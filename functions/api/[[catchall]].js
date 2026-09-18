import { handleWorkerFetch } from '../../server/worker.js';

export async function onRequest(context) {
  return handleWorkerFetch(context.request, context.env);
}
