import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.result.deleteMany();
  await prisma.query.deleteMany();
  await prisma.provider.deleteMany();

  // Create Provider
  const provider1 = await prisma.provider.create({
    data: {
      name: "pi-medical-v1.0",
      modelHash: "0x9a8bc4d1f2e3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      name: "pi-legal-v0.9",
      modelHash: "0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    },
  });

  // Create Queries
  await prisma.query.create({
    data: {
      providerId: provider1.id,
      status: "PAID",
      commitmentHash: "0x8f4c...3b92",
      reward: "5 tDUST",
      result: {
        create: {
          decryptedData: "Based on the described symptoms, the most likely differential diagnoses to consider are:\n- Common viral upper respiratory infection (URI)\n- Seasonal allergic rhinitis\n\nConfidence score: 0.89.",
          proofHash: "0x2a1b...9c8d"
        }
      }
    }
  });

  await prisma.query.create({
    data: {
      providerId: provider2.id,
      status: "PAID",
      commitmentHash: "0x1a2b...4c5d",
      reward: "10 tDUST",
      result: {
        create: {
          decryptedData: "The contract clause 4.2 contains a liability limitation that caps damages at 1x the annual contract value. This is standard but may expose the client to unmitigated risk in case of gross negligence.",
          proofHash: "0x1b2c...3d4e"
        }
      }
    }
  });

  await prisma.query.create({
    data: {
      providerId: provider1.id,
      status: "PROCESSING",
      commitmentHash: "0x...",
      reward: "-",
    }
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
