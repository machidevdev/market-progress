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
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);
    
    const [todayVotes, yesterdayVotes] = await Promise.all([
      // Get today's votes
      prisma.marketSentiment.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      // Get yesterday's votes
      prisma.marketSentiment.findMany({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),
    ]);

    return NextResponse.json({ today: todayVotes, yesterday: yesterdayVotes });
  } catch (error) {
    console.error('Failed to fetch sentiments:', error);
    return NextResponse.json({ error: 'Failed to fetch sentiments' }, { status: 500 });
  }
} 