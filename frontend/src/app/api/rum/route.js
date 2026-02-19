// Real User Metrics API - Samlar Core Web Vitals från riktiga användare
// Expertens förslag: Minimal client-side kod som postar batchetat data

import { NextResponse } from 'next/server';

const { storeRumEvent, getRumStats } = require('../../../core/rum.repo');

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const b = await request.json().catch(() => null);
    if (!b?.url) {
      return NextResponse.json({ 
        ok: false, 
        error: 'url saknas' 
      }, { status: 400 });
    }

    await storeRumEvent({
      url: b.url,
      lcp: Number(b.lcp) || undefined,
      cls: Number(b.cls) || undefined,
      inp: Number(b.inp) || undefined,
      ua: String(b.ua || ''),
      vp_w: b.vp?.w, 
      vp_h: b.vp?.h,
    });

    console.log(`📊 RUM data stored: ${b.url} - LCP: ${b.lcp}ms, CLS: ${b.cls}, INP: ${b.inp}ms`);
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('RUM API error:', error);
    return NextResponse.json({ 
      error: 'Failed to store RUM data',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const days = Number(searchParams.get('days') || 7);
    
    if (!url) {
      return NextResponse.json({ 
        ok: false, 
        error: 'url saknas' 
      }, { status: 400 });
    }

    const rows = await getRumStats(url, days);
    
    // Deep serialize to handle any remaining BigInt values
    const serializedRows = JSON.parse(JSON.stringify(rows, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ));
    
    return NextResponse.json({ ok: true, url, days, rows: serializedRows });
    
  } catch (error) {
    console.error('RUM GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch RUM data',
      message: error.message 
    }, { status: 500 });
  }
}