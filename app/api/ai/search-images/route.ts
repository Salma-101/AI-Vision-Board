import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoalCategory } from '@/lib/types';

const RequestSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.enum([
    'career', 'finance', 'travel', 'home',
    'wellness', 'learning', 'hobbies', 'lifestyle', 'other',
  ]).optional(),
});

interface PexelsPhoto {
  src: {
    large: string;
    medium: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  career: [
    'https://images.pexels.com/photos/20540999/pexels-photo-20540999.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1616105/pexels-photo-1616105.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1181342/pexels-photo-1181342.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/39219375/pexels-photo-39219375.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  finance: [
    'https://images.pexels.com/photos/210307/pexels-photo-210307.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/351264/pexels-photo-351264.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/5849587/pexels-photo-5849587.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/12955822/pexels-photo-12955822.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  travel: [
    'https://images.pexels.com/photos/1714456/pexels-photo-1714456.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2703825/pexels-photo-2703825.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/17916497/pexels-photo-17916497.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/5412528/pexels-photo-5412528.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  home: [
    'https://images.pexels.com/photos/2889618/pexels-photo-2889618.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/36252681/pexels-photo-36252681.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/7587828/pexels-photo-7587828.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  wellness: [
    'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/8436448/pexels-photo-8436448.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/8032840/pexels-photo-8032840.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  learning: [
    'https://images.pexels.com/photos/6789634/pexels-photo-6789634.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/38094569/pexels-photo-38094569.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/327882/pexels-photo-327882.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  hobbies: [
    'https://images.pexels.com/photos/1186577/pexels-photo-1186577.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/164763/pexels-photo-164763.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/6732664/pexels-photo-6732664.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2013664/pexels-photo-2013664.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  lifestyle: [
    'https://images.pexels.com/photos/13291016/pexels-photo-13291016.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/37895768/pexels-photo-37895768.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/7167832/pexels-photo-7167832.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/5546867/pexels-photo-5546867.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  other: [
    'https://images.pexels.com/photos/4984474/pexels-photo-4984474.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/826827/pexels-photo-826827.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/14771929/pexels-photo-14771929.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';

  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = RequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
  }

  const { query, category } = validation.data;
  const pexelsKey = process.env.PEXELS_API_KEY;

  if (pexelsKey) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`, {
        headers: { Authorization: pexelsKey },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = (await res.json()) as PexelsResponse;
        if (data.photos && data.photos.length > 0) {
          return NextResponse.json({
            images: data.photos.map((p) => ({ url: p.src.large, alt: p.alt })),
            source: 'pexels_api',
          });
        }
      }
    } catch {
      // Fall through to curated images
    }
  }

  const fallbackImages = CATEGORY_FALLBACK_IMAGES[category ?? 'other'] ?? CATEGORY_FALLBACK_IMAGES.other;
  const shuffled = [...fallbackImages].sort(() => Math.random() - 0.5).slice(0, 3);

  return NextResponse.json({
    images: shuffled.map((url) => ({ url, alt: query })),
    source: 'curated',
  });
}
