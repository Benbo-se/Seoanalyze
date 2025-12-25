import { handleRevalidationWebhook } from '../../../utils/revalidation';

export async function POST(request) {
  return handleRevalidationWebhook(request);
}