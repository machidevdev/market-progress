const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMiddleVotes() {
  try {
    // Generate 97 votes with a normal-ish distribution around the middle
    const votes = Array.from({ length: 97 }, () => {
      // Base around 50 (middle) with variance
      const variance = Math.floor(Math.random() * 30) - 15; // -15 to +15
      return Math.max(0, Math.min(100, 50 + variance)); // Clamp between 0-100
    });

    // Add votes to database
    const promises = votes.map(progress =>
      prisma.marketSentiment.create({
        data: {
          progress,
          ip: `seed_${Math.random()}`, // Unique IP for each seed vote
        },
      })
    );

    await Promise.all(promises);
    console.log('Added 97 votes around the middle range');
  } catch (error) {
    console.error('Error adding votes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMiddleVotes(); 