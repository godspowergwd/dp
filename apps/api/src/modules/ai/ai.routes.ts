import type { FastifyInstance } from 'fastify';
import { promotionService } from '../../integrations/promotion-service.js';

/**
 * AI Studio routes — /api/v1/ai
 * Content generation workflow. Placeholder/mock until a real AI provider is
 * configured (AI_API_KEY etc.). Product context is passed automatically from
 * the selected promotion's product.
 */
const CONTENT_TYPES = [
  { type: 'facebook_post', label: 'Facebook Post' },
  { type: 'instagram_post', label: 'Instagram Post' },
  { type: 'instagram_caption', label: 'Instagram Caption' },
  { type: 'instagram_story', label: 'Instagram Story Concept' },
  { type: 'tiktok_caption', label: 'TikTok Caption' },
  { type: 'tiktok_script', label: 'TikTok Video Script' },
  { type: 'ad_copy_short', label: 'Short Advertisement Copy' },
  { type: 'ad_copy_long', label: 'Long Advertisement Copy' },
  { type: 'product_description', label: 'Product Description' },
  { type: 'headline', label: 'Promotional Headline' },
  { type: 'cta', label: 'Call To Action' },
  { type: 'hashtags', label: 'Hashtags' },
];

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/content-types', { preHandler: auth }, async () => {
    return { data: CONTENT_TYPES };
  });

  app.get('/jobs', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });

  app.get('/jobs/:id', { preHandler: auth }, async (_request) => {
    return { data: null };
  });

  // Generate marketing content for a product (AI Studio "Generate" button)
  app.post('/generate', { preHandler: auth }, async (request, reply) => {
    const body = request.body as {
      productId: string;
      contentType?: string;
      tone?: string;
      audience?: string;
      goal?: string;
      length?: string;
    };
    if (!body?.productId) return reply.code(400).send({ error: 'productId is required' });
    try {
      const result = await promotionService.getAIContent(body.productId);
      return {
        data: {
          ...result,
          selectedType: body.contentType ?? result.suggestions[0].type,
          options: {
            tone: body.tone ?? 'friendly',
            audience: body.audience ?? 'general',
            goal: body.goal ?? 'sales',
            length: body.length ?? 'medium',
          },
          mode: 'demo', // 'demo' until a real AI provider is configured
        },
      };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });
}
