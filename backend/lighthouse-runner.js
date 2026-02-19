#!/usr/bin/env node

// Standalone Lighthouse runner - runs in separate process to avoid memory issues

const LighthouseAnalyzer = require('./lighthouse-analyzer.js');

async function runLighthouse() {
  const url = process.argv[2];

  if (!url) {
    console.error('URL is required');
    process.exit(1);
  }

  try {
    const analyzer = new LighthouseAnalyzer();
    const result = await analyzer.analyze(url);

    // Output result as JSON to stdout
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error('Lighthouse analysis failed:', error.message);
    process.exit(1);
  }
}

runLighthouse();