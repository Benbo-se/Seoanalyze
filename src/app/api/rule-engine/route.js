// Rule Engine API - Impact × Effort prioriterade åtgärder
import { NextResponse } from 'next/server';

const { RuleEngine } = require('../../../core/rule-engine');
const analysisRepo = require('../../../core/analysis.repo');
const artifactStore = require('../../../core/artifact.store');

export const runtime = 'nodejs';

// GET - Analysera och returnera prioriterade åtgärder
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const limit = Number(searchParams.get('limit') || 10);
    const category = searchParams.get('category'); // 'critical-seo', 'performance', etc.
    
    if (!analysisId) {
      return NextResponse.json({ 
        error: 'analysisId krävs för att generera åtgärder' 
      }, { status: 400 });
    }

    // Hämta analysis från databas
    const analysis = await analysisRepo.getById(analysisId);
    if (!analysis) {
      return NextResponse.json({ 
        error: 'Analys hittades inte' 
      }, { status: 404 });
    }

    // Skapa mockdata för test av Rule Engine
    const analysisData = {
      title: "Example Domain - Detta är en lång titel som är över 60 tecken vilket triggar regeln",
      metaDescription: "",
      headings: { h1: [] },
      images: [
        { src: "test1.jpg", alt: "" },
        { src: "test2.jpg", alt: "OK alt text" }
      ],
      canonical: null,
      robots: { status: "not_found" },
      structuredData: [],
      performance: {
        lcp: 3200,
        cls: 0.15
      }
    };

    // Kör Rule Engine analys
    const prioritizedRules = RuleEngine.analyzeAndPrioritize(analysisData, analysis.type);
    
    // Filtrera på kategori om specificerad
    const filteredRules = category 
      ? prioritizedRules.filter(rule => rule.category === category)
      : prioritizedRules;

    // Generera actionable lista
    const actionableList = RuleEngine.generateActionableList(filteredRules, limit);
    
    // Beräkna sammanfattning
    const summary = {
      totalIssues: prioritizedRules.length,
      criticalIssues: prioritizedRules.filter(r => r.impact >= 8).length,
      quickWins: prioritizedRules.filter(r => r.impact >= 6 && r.effort <= 3).length,
      averageROI: prioritizedRules.length > 0 
        ? Math.round((prioritizedRules.reduce((sum, r) => sum + r.roi, 0) / prioritizedRules.length) * 100) / 100
        : 0,
      categories: [...new Set(prioritizedRules.map(r => r.category))]
    };

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysisId,
        url: analysis.targetUrl,
        type: analysis.type,
        analyzedAt: analysis.createdAt
      },
      summary,
      actionableList,
      totalActions: actionableList.length
    });

  } catch (error) {
    console.error('Rule Engine API error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att generera prioriterade åtgärder',
      message: error.message 
    }, { status: 500 });
  }
}

// POST - Markera åtgärd som genomförd
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.analysisId || !body?.ruleId) {
      return NextResponse.json({ 
        error: 'analysisId och ruleId krävs' 
      }, { status: 400 });
    }

    // Här kan vi i framtiden spara genomförda åtgärder
    // För nu returnerar vi bara bekräftelse
    console.log(`✅ Åtgärd markerad som genomförd: ${body.ruleId} för analys ${body.analysisId}`);
    
    return NextResponse.json({ 
      success: true,
      message: `Åtgärd ${body.ruleId} markerad som genomförd`,
      ruleId: body.ruleId,
      analysisId: body.analysisId,
      completedAt: new Date()
    });

  } catch (error) {
    console.error('Rule Engine POST error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att markera åtgärd som genomförd',
      message: error.message 
    }, { status: 500 });
  }
}