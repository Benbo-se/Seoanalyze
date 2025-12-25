import { NextResponse } from 'next/server';
import { prisma } from '@/core/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch all logs
    const logs = await prisma.chatLog.findMany({
      where: {
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalQuestions: logs.length,
      uniqueSessions: new Set(logs.map(l => l.sessionId)).size,
      avgResponseTime: logs.length > 0 ? Math.round(
        logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / logs.length
      ) : 0,
      totalCost: logs.reduce((sum, l) => sum + (l.cost || 0), 0).toFixed(2),
      helpfulRate: calculateHelpfulRate(logs),
      topQuestions: getTopQuestions(logs, 20)
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function calculateHelpfulRate(logs) {
  const withFeedback = logs.filter(l => l.helpful !== null);
  if (withFeedback.length === 0) return null;

  const helpful = withFeedback.filter(l => l.helpful === true).length;
  return Math.round((helpful / withFeedback.length) * 100);
}

function getTopQuestions(logs, limit = 20) {
  // Group similar questions (case-insensitive)
  const questions = {};

  logs.forEach(log => {
    const q = log.userMessage.toLowerCase().trim();
    if (!questions[q]) {
      questions[q] = {
        question: log.userMessage,
        count: 0,
        examples: []
      };
    }
    questions[q].count++;
    if (questions[q].examples.length < 3) {
      questions[q].examples.push({
        answer: log.botResponse.substring(0, 100) + '...',
        helpful: log.helpful
      });
    }
  });

  // Sort by frequency
  return Object.values(questions)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
