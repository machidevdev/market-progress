import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { progress } = await request.json();

    // Check if user has voted today
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

    if (existingVote) {
      return NextResponse.json(
        { error: 'Already voted today' },
        { status: 429 }
      );
    }

    const sentiment = await prisma.marketSentiment.create({
      data: {
        progress,
        ip,
      },
    });

    return NextResponse.json(sentiment);
  } catch (error) {
    console.error('Failed to save sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to save sentiment' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sentiments = await prisma.marketSentiment.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        progress: true,
        createdAt: true,
        // Don't send IP addresses to client
      },
    });

    return NextResponse.json(sentiments);
  } catch (error) {
    console.error('Failed to fetch sentiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiments' },
      { status: 500 }
    );
  }
} 