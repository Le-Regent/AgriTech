import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameters.' }, { status: 400 });
  }

  try {
    // Basic protection/validation for safe URLs or picsum
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid protocols on proxy.' }, { status: 400 });
    }

    const response = await fetch(imageUrl, {
      next: { revalidate: 86450 }, // Next.js ISR Cache 24 Hours
    });

    if (!response.ok) {
      throw new Error('Upstream fetched failed on image proxy!');
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable', // Cache client-side and CDN-side for 7 days
      }
    });
  } catch (error: any) {
    console.warn('Image proxy failed, redirecting to original URL:', error);
    try {
      return NextResponse.redirect(new URL(imageUrl));
    } catch {
      return NextResponse.json({ error: error.message || 'Image Proxy error' }, { status: 500 });
    }
  }
}
