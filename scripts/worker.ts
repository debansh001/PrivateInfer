import { Redis } from '@upstash/redis';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const neon = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(neon);
const prisma = new PrismaClient({ adapter });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Worker started. Listening to 'inference_queue'...");

  while (true) {
    try {
      // Pop from queue
      const job = await redis.rpop("inference_queue");
      
      if (!job) {
        await sleep(2000);
        continue;
      }

      // @ts-ignore
      const { queryId, encryptedBlob } = typeof job === 'string' ? JSON.parse(job) : job;
      console.log(`Processing query ${queryId}...`);

      // 1. Update status to PROCESSING
      await prisma.query.update({
        where: { id: queryId },
        data: { status: "PROCESSING" }
      });

      // Simulate off-chain inference delay
      await sleep(3000);

      // 2. Generate Result (Stub for Midnight Phase 4)
      const mockResultHash = "0x" + Math.random().toString(16).slice(2, 10);
      const mockProofHash = "0x" + Math.random().toString(16).slice(2, 10);

      await prisma.query.update({
        where: { id: queryId },
        data: { 
          status: "RESULT_READY",
          commitmentHash: mockResultHash,
          result: {
            create: {
              decryptedData: "Based on the described symptoms, the most likely differential diagnoses to consider are:\n- Common viral upper respiratory infection (URI)\n- Seasonal allergic rhinitis\n\nConfidence score: 0.89.",
              proofHash: mockProofHash
            }
          }
        }
      });

      console.log(`Result generated for ${queryId}.`);

      // Simulate Midnight settlement delay
      await sleep(2000);

      // 3. Mark as PAID
      await prisma.query.update({
        where: { id: queryId },
        data: { status: "PAID" }
      });

      console.log(`Query ${queryId} settled and PAID.`);

    } catch (e) {
      console.error("Worker Error:", e);
      await sleep(5000);
    }
  }
}

main();
