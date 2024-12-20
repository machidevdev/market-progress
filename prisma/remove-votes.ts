const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

interface MarketSentiment {
  id: string;
  progress: number;
  // ... other fields ...
}

async function removeVotes() {
  try {
    // Find votes in 0-10% range
    const votes = await prisma.marketSentiment.findMany({
      where: {
        progress: {
          gte: 0,
          lt: 10,
        },
      },
      take: 100, // Limit to 1400 records
    });

    // Delete the found votes
    const deleteResult = await prisma.marketSentiment.deleteMany({
      where: {
        id: {
          in: votes.map((vote: MarketSentiment) => vote.id),
        },
      },
    });

    console.log(`Deleted ${deleteResult.count} votes`);
  } catch (error) {
    console.error('Error removing votes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeVotes(); 