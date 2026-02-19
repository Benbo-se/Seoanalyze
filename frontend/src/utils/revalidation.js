import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Revalidate analysis page after completion
 * @param {string} jobId - Analysis job ID
 */
export function revalidateAnalysis(jobId) {
  try {
    // Revalidate the specific analysis page
    revalidatePath(`/analys/${jobId}`);
    
    // Revalidate analysis tag (for related content)
    revalidateTag(`analysis-${jobId}`);
    
    console.log(`Revalidated analysis ${jobId}`);
  } catch (error) {
    console.error('Failed to revalidate analysis:', error);
  }
}

/**
 * Revalidate home page statistics and trending analyses
 */
export function revalidateHomePage() {
  try {
    // Revalidate home page
    revalidatePath('/');
    
    // Revalidate trending and statistics tags
    revalidateTag('trending-analyses');
    revalidateTag('statistics');
    
    console.log('Revalidated home page');
  } catch (error) {
    console.error('Failed to revalidate home page:', error);
  }
}

/**
 * Revalidate analysis history for a specific URL
 * @param {string} url - URL to revalidate history for
 */
export function revalidateAnalysisHistory(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    
    // Revalidate history API endpoint
    revalidateTag(`history-${encodedUrl}`);
    
    console.log(`Revalidated history for ${url}`);
  } catch (error) {
    console.error('Failed to revalidate analysis history:', error);
  }
}

/**
 * Cache configuration for different content types
 */
export const CacheConfig = {
  // Static content - cache for 1 day
  STATIC: 86400,
  
  // Analysis results - cache for 1 hour  
  ANALYSIS: 3600,
  
  // Analysis history - cache for 30 minutes
  HISTORY: 1800,
  
  // Statistics - cache for 15 minutes
  STATISTICS: 900,
  
  // Trending content - cache for 5 minutes
  TRENDING: 300,
};

/**
 * Generate cache tags for content
 * @param {string} type - Content type
 * @param {string} identifier - Content identifier
 * @returns {string[]} Cache tags
 */
export function generateCacheTags(type, identifier) {
  const tags = [type];
  
  if (identifier) {
    tags.push(`${type}-${identifier}`);
  }
  
  return tags;
}

/**
 * On-demand revalidation webhook handler
 * @param {Request} request - Webhook request
 * @returns {Response} Response
 */
export async function handleRevalidationWebhook(request) {
  try {
    const { type, identifier, secret } = await request.json();
    
    // Verify webhook secret
    if (secret !== process.env.REVALIDATION_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    switch (type) {
      case 'analysis':
        revalidateAnalysis(identifier);
        break;
        
      case 'home':
        revalidateHomePage();
        break;
        
      case 'history':
        revalidateAnalysisHistory(identifier);
        break;
        
      default:
        return new Response('Invalid revalidation type', { status: 400 });
    }
    
    return new Response('Revalidated', { status: 200 });
    
  } catch (error) {
    console.error('Revalidation webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}