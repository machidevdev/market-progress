import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingVote = await prisma.marketSentiment.findFirst({
      where: {
        ip,
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({ hasVoted: !!existingVote });
  } catch (error) {
    console.error('Failed to check vote status:', error);
    return NextResponse.json({ hasVoted: false }, { status: 500 });
  }
} 