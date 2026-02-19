import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

// Försök återanvända samma bas som artifact.store.js
// Om den modulen exporterar en klass, skapas en instans för att läsa localPath.
// Faller tillbaka till env eller ett rimligt standardvärde.
let baseDir = process.env.ARTIFACTS_LOCAL_PATH || path.join(process.cwd(), 'artifacts');
try {
  // eslint-disable-next-line
  const ArtifactStore = require('../../../../core/artifact.store.js');
  const store = new ArtifactStore();
  if (store?.localPath) baseDir = store.localPath;
} catch (_) { /* no-op */ }

export async function GET(_req, { params }) {
  try {
    const rel = (params?.path || []).join('/');              // t.ex. analyses/2025-09-08/<id>/screenshots/desktop.png
    if (!rel || !rel.startsWith('analyses/')) {
      return NextResponse.json({ error: 'Bad key' }, { status: 400 });
    }

    // guard mot path traversal
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