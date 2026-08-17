import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize server-side Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Helper to scrape OpenGraph metadata from HTML string
 */
function extractHtmlMetadata(html: string, baseUrl: string) {
  let title = '';
  let description = '';
  let ogImage = '';
  let favicon = '';

  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1].trim();
    }

    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      description = ogDescMatch[1].trim();
    }

    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      ogImage = ogImageMatch[1].trim();
      if (ogImage.startsWith('/') && !ogImage.startsWith('//')) {
        const u = new URL(baseUrl);
        ogImage = `${u.origin}${ogImage}`;
      }
    }

    const faviconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
    if (faviconMatch && faviconMatch[1]) {
      favicon = faviconMatch[1].trim();
      if (favicon.startsWith('/') && !favicon.startsWith('//')) {
        const u = new URL(baseUrl);
        favicon = `${u.origin}${favicon}`;
      }
    }
  } catch (e) {
    console.warn('Error regex-parsing HTML metadata:', e);
  }

  return { title, description, ogImage, favicon };
}

/**
 * POST /api/analyze-website
 * Analyzes any website link, extracting core functionalities, description,
 * title, category, tags, and preview image using Gemini 3.7 Flash.
 */
app.post('/api/analyze-website', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required.' });
      return;
    }

    const targetUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    let domain = '';
    try {
      const u = new URL(targetUrl);
      domain = u.hostname.replace(/^www\./, '');
    } catch {
      res.status(400).json({ error: 'Invalid URL format.' });
      return;
    }

    // 1. Fetch website HTML if reachable to get OpenGraph data
    let htmlMeta = { title: '', description: '', ogImage: '', favicon: '' };
    let rawHtmlSample = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (fetchRes.ok) {
        const text = await fetchRes.text();
        htmlMeta = extractHtmlMetadata(text, targetUrl);
        rawHtmlSample = text.slice(0, 3000);
      }
    } catch (e) {
      console.warn(`Could not directly fetch ${targetUrl}:`, e);
    }

    // 2. Call Gemini 3.7 Flash to deeply analyze the website
    let aiTitle = htmlMeta.title;
    let aiDescription = htmlMeta.description;
    let coreFunctionalities: string[] = [];
    let suggestedType = 'Website';
    let suggestedCategory = 'Developer Tools';
    let suggestedTags: string[] = [domain.split('.')[0]];
    let previewImage = htmlMeta.ogImage || undefined;

    if (aiClient) {
      try {
        const prompt = `Analyze the website and tool at URL: ${targetUrl} (Domain: ${domain}).
Webpage Metadata Hints:
- Page Title: ${htmlMeta.title || 'Unknown'}
- Page Description: ${htmlMeta.description || 'Unknown'}

Please analyze what this website does, its purpose, its target audience, and its core functionalities.
Respond in valid JSON format matching this structure exactly:
{
  "title": "Clean, official brand or project title",
  "description": "A concise 1-2 sentence overview of what the website is and what problem it solves",
  "coreFunctionalities": [
    "Core Feature 1: Specific detail on how it works",
    "Core Feature 2: Specific capability or tooling",
    "Core Feature 3: Key workflow or user benefit",
    "Core Feature 4: Integration or performance highlight"
  ],
  "suggestedType": "Website" | "Component" | "Code" | "Prompt" | "Video" | "Tutorial" | "Inspiration" | "Animation" | "Template" | "Idea" | "Other",
  "suggestedCategory": "UI Frameworks" | "Design Systems" | "AI Tools" | "Developer Tools" | "Inspiration" | "Libraries" | "Documentation" | "Templates" | "Productivity" | "Web Resources",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4"],
  "previewImageUrl": "URL to representative logo/preview image if known, or empty string"
}
`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const textOutput = response.text || '';
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title) aiTitle = parsed.title;
          if (parsed.description) aiDescription = parsed.description;
          if (Array.isArray(parsed.coreFunctionalities) && parsed.coreFunctionalities.length > 0) {
            coreFunctionalities = parsed.coreFunctionalities;
          }
          if (parsed.suggestedType) suggestedType = parsed.suggestedType;
          if (parsed.suggestedCategory) suggestedCategory = parsed.suggestedCategory;
          if (Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0) {
            suggestedTags = parsed.suggestedTags;
          }
          if (!previewImage && parsed.previewImageUrl && parsed.previewImageUrl.startsWith('http')) {
            previewImage = parsed.previewImageUrl;
          }
        }
      } catch (aiErr) {
        console.warn('Gemini API analysis encountered an issue, falling back to scraped metadata:', aiErr);
      }
    }

    // Default core functionalities if empty
    if (coreFunctionalities.length === 0) {
      coreFunctionalities = [
        `Direct web portal and resource catalog at ${domain}`,
        'Interactive developer and designer documentation',
        'Searchable component and asset integration',
        'Responsive layout and modern design standards',
      ];
    }

    if (!aiTitle) {
      const parts = domain.split('.');
      aiTitle = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    if (!aiDescription) {
      aiDescription = `Online platform and resource reference hosted at ${domain}. Captured with verified link.`;
    }

    res.json({
      title: aiTitle,
      description: aiDescription,
      coreFunctionalities,
      suggestedType,
      suggestedCategory,
      suggestedTags,
      previewImage: previewImage || undefined,
      favicon: htmlMeta.favicon || undefined,
      sourceUrl: targetUrl,
    });
  } catch (error) {
    console.error('Error in /api/analyze-website:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Analysis failed.' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production' || !process.env.VITE_DEV) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
