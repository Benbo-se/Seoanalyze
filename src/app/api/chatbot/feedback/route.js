import { NextResponse } from 'next/server';
import { prisma } from '@/core/prisma';

export async function POST(request) {
  try {
    const { logId, helpful, feedbackText } = await request.json();

    if (!logId) {
      return NextResponse.json({ error: 'logId required' }, { status: 400 });
    }

    await prisma.chatLog.update({
      where: { id: logId },
      data: {
        helpful: helpful === true ? true : (helpful === false ? false : null),
        feedbackText: feedbackText || null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
