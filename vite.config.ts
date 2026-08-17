import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/analyze-website' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { url } = JSON.parse(body || '{}');
              if (!url || typeof url !== 'string') {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'URL is required.' }));
                return;
              }

              const targetUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
              let domain = '';
              try {
                const u = new URL(targetUrl);
                domain = u.hostname.replace(/^www\./, '');
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid URL format.' }));
                return;
              }

              // 1. Fetch website HTML for OpenGraph meta tags
              let htmlTitle = '';
              let htmlDesc = '';
              let ogImage = '';
              let favicon = '';

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
                  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
                  if (titleMatch && titleMatch[1]) htmlTitle = titleMatch[1].trim();

                  const ogTitleMatch = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                                       text.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
                  if (ogTitleMatch && ogTitleMatch[1]) htmlTitle = ogTitleMatch[1].trim();

                  const ogDescMatch = text.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                                      text.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                                      text.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
                  if (ogDescMatch && ogDescMatch[1]) htmlDesc = ogDescMatch[1].trim();

                  const ogImgMatch = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                                     text.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                                     text.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
                  if (ogImgMatch && ogImgMatch[1]) {
                    ogImage = ogImgMatch[1].trim();
                    if (ogImage.startsWith('/') && !ogImage.startsWith('//')) {
                      const u = new URL(targetUrl);
                      ogImage = `${u.origin}${ogImage}`;
                    }
                  }

                  const favMatch = text.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i) ||
                                   text.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
                  if (favMatch && favMatch[1]) {
                    favicon = favMatch[1].trim();
                    if (favicon.startsWith('/') && !favicon.startsWith('//')) {
                      const u = new URL(targetUrl);
                      favicon = `${u.origin}${favicon}`;
                    }
                  }
                }
              } catch (e) {
                console.warn(`[Dev API] Could not directly fetch HTML for ${targetUrl}:`, e);
              }

              // 2. Call Gemini 3.7 Flash
              let aiTitle = htmlTitle;
              let aiDescription = htmlDesc;
              let coreFunctionalities: string[] = [];
              let suggestedType = 'Website';
              let suggestedCategory = 'Developer Tools';
              let suggestedTags: string[] = [domain.split('.')[0]];
              let previewImage = ogImage || undefined;

              const apiKey = process.env.GEMINI_API_KEY;
              if (apiKey) {
                try {
                  const aiClient = new GoogleGenAI({
                    apiKey,
                    httpOptions: {
                      headers: {
                        'User-Agent': 'aistudio-build',
                      },
                    },
                  });

                  const prompt = `Analyze the website at URL: ${targetUrl} (Domain: ${domain}).
Webpage Metadata Hints:
- Page Title: ${htmlTitle || 'Unknown'}
- Page Description: ${htmlDesc || 'Unknown'}

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
  "previewImageUrl": "URL to representative preview image if known, or empty string"
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
                  console.warn('[Dev API] Gemini API call error:', aiErr);
                }
              }

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

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  title: aiTitle,
                  description: aiDescription,
                  coreFunctionalities,
                  suggestedType,
                  suggestedCategory,
                  suggestedTags,
                  previewImage: previewImage || undefined,
                  favicon: favicon || undefined,
                  sourceUrl: targetUrl,
                })
              );
            } catch (err) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : 'Server error occurred during analysis',
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
