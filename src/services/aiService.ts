import type { ResourceType } from '../types';
import { parseUrlInfo, getFriendlyDomain } from '../utils/urlUtils';

export interface WebsiteAnalysisResult {
  title: string;
  description: string;
  coreFunctionalities: string[];
  suggestedType: ResourceType;
  suggestedCategory: string;
  suggestedTags: string[];
  previewImage?: string;
  favicon?: string;
  sourceUrl: string;
}

export const aiService = {
  /**
   * Calls the server endpoint to analyze a website URL using Gemini 3.7 Flash
   * with Google Search Grounding and metadata scraping.
   */
  async analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    const domain = getFriendlyDomain(cleanUrl);

    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      return {
        title: data.title || domain || 'Website Resource',
        description:
          data.description ||
          `Online resource and tool available at ${domain}. Analyzed and saved to component vault.`,
        coreFunctionalities: Array.isArray(data.coreFunctionalities)
          ? data.coreFunctionalities
          : [],
        suggestedType: (data.suggestedType as ResourceType) || 'Website',
        suggestedCategory: data.suggestedCategory || 'Web Resources',
        suggestedTags: Array.isArray(data.suggestedTags) ? data.suggestedTags : [domain.split('.')[0]],
        previewImage: data.previewImage || undefined,
        favicon: data.favicon || undefined,
        sourceUrl: cleanUrl,
      };
    } catch (err) {
      console.warn('AI analysis API call failed or server unavailable, using fallback metadata generator:', err);

      // Client-side graceful fallback
      const domainParts = domain.split('.');
      const cleanName =
        domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);

      return {
        title: cleanName,
        description: `Resource and reference page hosted at ${domain}. Captured with direct link.`,
        coreFunctionalities: [
          `Direct web portal and resource reference at ${domain}`,
          'Interactive user interface and developer documentation',
          'Fast access and search index',
        ],
        suggestedType: 'Website',
        suggestedCategory: 'Web Resources',
        suggestedTags: [domainParts[0].toLowerCase(), 'web', 'resource'],
        sourceUrl: cleanUrl,
      };
    }
  },
};
