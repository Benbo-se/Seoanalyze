import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

// Basdir som i artifact.store.js
let baseDir = process.env.ARTIFACTS_LOCAL_PATH || path.join(process.cwd(), 'artifacts');
try {
  // eslint-disable-next-line
  const ArtifactStore = require('../../../../../../core/artifact.store.js');
  const store = new ArtifactStore();
  if (store?.localPath) baseDir = store.localPath;
} catch (_) { /* no-op */ }

export async function GET(_req, { params }) {
  try {
    const analysisId = params?.analysisId;
    const rest = params?.rest || [];
    if (!analysisId || !/^[0-9A-Za-z]+$/.test(analysisId)) {
      return NextResponse.json({ error: 'Bad analysisId' }, { status: 400 });
    }

    const analysesRoot = path.join(baseDir, 'analyses');

    // Lista datum-mappar och hitta de som innehåller /<analysisId>/
    const entries = await fs.readdir(analysesRoot, { withFileTypes: true }).catch(() => []);
    const candidates = [];
    for (const d of entries) {
      if (!d.isDirectory()) continue;
      const dateDir = path.join(analysesRoot, d.name);
      try {
        const idPath = path.join(dateDir, analysisId);
        const stat = await fs.stat(idPath).catch(() => null);
        if (stat && stat.isDirectory()) candidates.push(d.name);
      } catch { /* skip */ }
    }
    if (!candidates.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // YYYY-MM-DD sorteras lexikografiskt -> sista är senast
    candidates.sort();
    const latestDate = candidates[candidates.length - 1];

    const rel = path.join('analyses', latestDate, analysisId, ...rest);
    const abs = path.normalize(path.join(baseDir, rel));
    if (!abs.startsWith(path.normalize(baseDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await fs.readFile(abs);
    const type = mime.lookup(abs) || 'application/octet-stream';
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}