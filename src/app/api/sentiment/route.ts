import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { progress } = await request.json();
    
    const sentiment = await prisma.marketSentiment.create({
      data: {
        progress,
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
      take: 100, // Last 100 entries
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