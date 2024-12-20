import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { progress } = await request.json();

    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    const existingVote = await prisma.marketSentiment.findFirst({
      where: {
        ip,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted today. Please come back tomorrow!' },
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
      { error: 'You have already voted today from a different browser. Please come back tomorrow!' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    const sentiments = await prisma.marketSentiment.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        progress: true,
        createdAt: true,
      },
    });

    return NextResponse.json(sentiments);
  } catch (error) {
    console.error('Failed to fetch sentiments:', error);
    return NextResponse.json({ error: 'Failed to fetch sentiments' }, { status: 500 });
  }
} 