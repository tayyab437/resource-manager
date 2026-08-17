import type { Resource, Category, Tag, Collection } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-ui-components',
    name: 'UI Components',
    description: 'Reusable interactive visual UI elements and layouts',
    icon: 'LayoutGrid',
    color: 'emerald',
    createdAt: Date.now() - 1000000,
  },
  {
    id: 'cat-ai-prompts',
    name: 'AI Prompts',
    description: 'System prompts, UI generation prompts, and LLM instructions',
    icon: 'Sparkles',
    color: 'amber',
    createdAt: Date.now() - 900000,
  },
  {
    id: 'cat-code-snippets',
    name: 'Code Snippets',
    description: 'Utility functions, custom hooks, and algorithmic helpers',
    icon: 'Code2',
    color: 'cyan',
    createdAt: Date.now() - 800000,
  },
  {
    id: 'cat-animations',
    name: 'Animations',
    description: 'Framer Motion, CSS keyframes, and micro-interactions',
    icon: 'Activity',
    color: 'purple',
    createdAt: Date.now() - 700000,
  },
  {
    id: 'cat-inspiration',
    name: 'Inspiration',
    description: 'Design references, landing pages, and visual art directions',
    icon: 'Compass',
    color: 'rose',
    createdAt: Date.now() - 600000,
  },
  {
    id: 'cat-tutorials',
    name: 'Tutorials & Guides',
    description: 'Videos, articles, and step-by-step dev guides',
    icon: 'BookOpen',
    color: 'blue',
    createdAt: Date.now() - 500000,
  },
];

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-react', name: 'react', createdAt: Date.now() - 1000000 },
  { id: 'tag-tailwind', name: 'tailwind', createdAt: Date.now() - 950000 },
  { id: 'tag-typescript', name: 'typescript', createdAt: Date.now() - 900000 },
  { id: 'tag-glassmorphism', name: 'glassmorphism', createdAt: Date.now() - 850000 },
  { id: 'tag-animation', name: 'animation', createdAt: Date.now() - 800000 },
  { id: 'tag-prompt', name: 'prompt', createdAt: Date.now() - 750000 },
  { id: 'tag-dashboard', name: 'dashboard', createdAt: Date.now() - 700000 },
  { id: 'tag-darkmode', name: 'darkmode', createdAt: Date.now() - 650000 },
  { id: 'tag-framer-motion', name: 'framer-motion', createdAt: Date.now() - 600000 },
  { id: 'tag-saas', name: 'saas', createdAt: Date.now() - 550000 },
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-portfolio',
    name: 'Portfolio Website Ideas',
    description: 'Curated components, prompts, and designs for modern dev portfolios',
    icon: 'Briefcase',
    color: 'indigo',
    resourceIds: ['res-glass-card', 'res-hero-prompt', 'res-gradient-text'],
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000,
  },
  {
    id: 'col-design-system',
    name: 'Design System Fundamentals',
    description: 'Core UI building blocks, typography snippets, and color themes',
    icon: 'Palette',
    color: 'violet',
    resourceIds: ['res-glass-card', 'res-navbar-code'],
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
  },
];

// SVG placeholder images encoded as data URIs for instant local rendering without network dependencies
const SVG_GLASS_CARD = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="50%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%23311042"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(255,255,255,0.25)"/><stop offset="100%" stop-color="rgba(255,255,255,0.05)"/></linearGradient></defs><rect width="600" height="340" fill="url(%23g1)"/><rect x="60" y="50" width="480" height="240" rx="20" fill="url(%23g2)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/><circle cx="120" cy="110" r="30" fill="%236366f1" opacity="0.8"/><rect x="170" y="95" width="220" height="12" rx="6" fill="%23ffffff" opacity="0.9"/><rect x="170" y="117" width="140" height="8" rx="4" fill="%23ffffff" opacity="0.5"/><rect x="100" y="170" width="400" height="80" rx="12" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.15)"/><text x="120" y="215" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23a5b4fc">Glassmorphism Metric Card</text></svg>`;

const SVG_HERO_ANIMATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><defs><radialGradient id="rg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%230f172a"/></radialGradient></defs><rect width="600" height="340" fill="%230f172a"/><circle cx="300" cy="170" r="140" fill="url(%23rg)" opacity="0.8"/><text x="300" y="175" font-family="sans-serif" font-size="28" font-weight="800" fill="%23ffffff" text-anchor="middle">AURA MESH</text></svg>`;

export const DEMO_RESOURCES: Resource[] = [
  {
    id: 'res-glass-card',
    title: 'Glassmorphism Metric Card Component',
    description: 'A frosted glass container card featuring subtle borders, glow highlights, and stat indicators styled with Tailwind CSS.',
    type: 'Component',
    categoryId: 'cat-ui-components',
    tagIds: ['tag-react', 'tag-tailwind', 'tag-glassmorphism', 'tag-dashboard'],
    collectionIds: ['col-portfolio', 'col-design-system'],
    images: [{ id: 'img-1', dataUrl: SVG_GLASS_CARD, name: 'Glass Card Preview' }],
    sourceUrl: 'https://tailwindui.com/components',
    code: {
      language: 'tsx',
      content: `import React from 'react';
import { TrendingUp } from 'lucide-react';

export function MetricCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/40 hover:scale-[1.02]">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      <p className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">{title}</p>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          {change}
        </span>
      </div>
    </div>
  );
}`,
    },
    prompt: `Act as a senior frontend engineer. Build a dark-mode React component for a analytics metric card using Tailwind CSS. It should feature a glassmorphism backdrop (backdrop-blur-xl, white/10 fill, border-white/20), a glowing radial mesh highlight in the corner, and smooth hover scaling. Include TypeScript interfaces.`,
    notes: `Requires Tailwind v3 or v4 with backdrop-blur support. Ensure parent element has a colorful background for maximum glass effect!`,
    favorite: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'res-hero-prompt',
    title: 'Landing Page Hero Copy & Layout Prompt',
    description: 'System prompt for generating production-ready developer tool landing pages with hero copy, CTA structure, and feature highlights.',
    type: 'Prompt',
    categoryId: 'cat-ai-prompts',
    tagIds: ['tag-prompt', 'tag-react', 'tag-saas'],
    collectionIds: ['col-portfolio'],
    prompt: `You are an expert UX Architect and Copywriter for Developer Tools.
Generate the hero section code and copy for a new developer tool.
Include:
1. Eyebrow badge: e.g. "🚀 Introducing Component Vault v2.0"
2. Main headline: Action-oriented, high-contrast, max 8 words.
3. Subtitle: 2 sentences explaining value proposition and local-first architecture.
4. Two CTAs: Primary glow button + Secondary outline button with icon.
5. Code preview window with tab toggles (React, Vue, Svelte).

Styling requirements:
- Use dark indigo background (#0f172a).
- Accent colors: Violet-500, Cyan-400.
- High contrast typography with tight tracking.`,
    notes: `Used this prompt to generate the hero layout for our local project! Produces great results with Gemini 1.5 Pro and Flash.`,
    favorite: true,
    createdAt: Date.now() - 3600000 * 18,
    updatedAt: Date.now() - 3600000 * 18,
  },
  {
    id: 'res-navbar-code',
    title: 'Responsive Command Palette Navbar Component',
    description: 'A sticky header bar with Cmd+K command palette trigger, theme toggle button, and responsive mobile drawer menu.',
    type: 'Code',
    categoryId: 'cat-code-snippets',
    tagIds: ['tag-react', 'tag-tailwind', 'tag-typescript'],
    collectionIds: ['col-design-system'],
    code: {
      language: 'tsx',
      content: `import React, { useState } from 'react';
import { Search, Command, Sun, Moon, Menu, X } from 'lucide-react';

export function HeaderNav({ onOpenCommand, onToggleTheme, isDark }: {
  onOpenCommand: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-slate-900 dark:text-white">Vault</span>
        </div>

        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-400"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search resources...</span>
          <kbd className="ml-4 font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}`,
    },
    sourceUrl: 'https://github.com/shadcn-ui/ui',
    notes: `Lightweight alternative to full shadcn navbar. Works out of the box with Lucide icons.`,
    favorite: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'res-framer-video',
    title: 'Framer Motion Layout Animations Masterclass',
    description: 'Comprehensive video guide covering layout animations, layoutId transitions, and exit animations in React applications.',
    type: 'Video',
    categoryId: 'cat-tutorials',
    tagIds: ['tag-animation', 'tag-framer-motion', 'tag-react'],
    collectionIds: [],
    videoUrl: 'https://www.youtube.com/watch?v=52S86eX1y2Y',
    sourceUrl: 'https://www.youtube.com/watch?v=52S86eX1y2Y',
    notes: `Check timestamps at 08:30 for layoutId card expanding to full detail modal explanation. Essential viewing for React motion devs!`,
    favorite: true,
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now() - 3600000 * 6,
  },
  {
    id: 'res-gradient-text',
    title: 'Tailwind CSS Gradient Animated Text Snippet',
    description: 'CSS background clip text gradient with subtle shifting shimmer animation effect.',
    type: 'Code',
    categoryId: 'cat-code-snippets',
    tagIds: ['tag-tailwind', 'tag-animation'],
    collectionIds: ['col-portfolio'],
    code: {
      language: 'html',
      content: `<h1 class="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient">
  Component Vault
</h1>`,
    },
    notes: `Requires keyframe definition in Tailwind config or index.css for smooth infinite looping animation.`,
    favorite: false,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'res-aura-mesh',
    title: 'Aura Mesh Ambient Gradient Background',
    description: 'Pure CSS radial mesh blur background snippet for high-end dark theme hero sections.',
    type: 'Inspiration',
    categoryId: 'cat-inspiration',
    tagIds: ['tag-darkmode', 'tag-glassmorphism', 'tag-saas'],
    collectionIds: [],
    images: [{ id: 'img-mesh', dataUrl: SVG_HERO_ANIMATION, name: 'Aura Mesh' }],
    sourceUrl: 'https://hypercolor.dev',
    notes: `Great reference for adding depth to dark UI backgrounds without distracting heavy graphics.`,
    favorite: false,
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
];
