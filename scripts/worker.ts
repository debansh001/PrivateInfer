/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from '@upstash/redis';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config({ path: '.env' });

const neon = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(neon as any);
const prisma = new PrismaClient({ adapter: adapter as any });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Polling / backoff intervals — tunable via env for production
const QUEUE_POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '2000', 10);
const ERROR_BACKOFF_MS = parseInt(process.env.WORKER_ERROR_BACKOFF_MS || '5000', 10);

/**
 * Real AI Inference Engine.
 *
 * Requires GROQ_API_KEY to be set in the environment.
 * Hard-fails if the key is missing — never returns fabricated medical output.
 *
 * The proofHash is deterministically derived from queryInputHash + inference output,
 * making it tamper-evident and reproducible for the on-chain Compact circuit.
 */
async function runMedicalInference(rawQuery: string, queryInputHash: string) {
  if (!groq) {
    throw new Error(
      "GROQ_API_KEY is not configured. The worker cannot perform AI inference. " +
      "Set GROQ_API_KEY in your environment and restart the worker."
    );
  }
  if (!rawQuery) {
    throw new Error("No raw query text received. Cannot run inference.");
  }

  console.log("[Worker] Running Groq inference (LLaMA-3)...");
  let inference: string;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are a secure, privacy-preserving medical AI inference node. Provide a concise, professional diagnosis based on the user's symptoms. Always end your response with 'Recommendation: Consult a licensed physician for confirmation. This output is a privacy-preserving inference result and does not constitute medical advice.'"
        },
        { role: "user", content: rawQuery }
      ],
      temperature: 0.2,
      max_tokens: 250,
    });
    inference = completion.choices[0]?.message?.content || "";
    if (!inference) throw new Error("Groq returned an empty response.");
  } catch (e) {
    console.error("[Worker] Groq API error:", e);
    throw e;
  }

  // proofHash = SHA-256(queryInputHash + inference_output)
  // Links the specific input to the specific output — tamper-evident and reproducible.
  const proofPayload = queryInputHash + inference;
  const proofHash = crypto.createHash('sha256').update(proofPayload).digest('hex');

  // resultHash = SHA-256(inference_output) — stored as on-chain commitmentHash
  const resultHash = crypto.createHash('sha256').update(inference).digest('hex');

  return { inference, proofHash, resultHash };
}

async function main() {
  if (!groq) {
    console.error("[Worker] FATAL: GROQ_API_KEY is not set. Exiting.");
    process.exit(1);
  }

  console.log("PrivateInfer Worker started. Listening to 'inference_queue'...");

  while (true) {
    try {
      const job = await redis.rpop("inference_queue");

      if (!job) {
        await sleep(QUEUE_POLL_INTERVAL_MS);
        continue;
      }

      const { queryId, rawQuery, encryptedBlob } = typeof job === 'string' ? JSON.parse(job) : job;
      console.log(`[Worker] Processing query ${queryId}...`);

      await prisma.query.update({
        where: { id: queryId },
        data: { status: "PROCESSING" }
      });

      // The inputHash is the SHA-256 commitment of the query text (the encryptedBlob).
      // It is used as the public anchor for the proof chain.
      const inputHash = encryptedBlob || crypto.createHash('sha256').update(queryId).digest('hex');

      const { inference, proofHash, resultHash } = await runMedicalInference(rawQuery, inputHash);

      // Avoid duplicate insert if worker retries
      const existing = await prisma.result.findUnique({ where: { queryId } });

      await prisma.query.update({
        where: { id: queryId },
        data: {
          status: "RESULT_READY",
          commitmentHash: resultHash,
          ...(!existing && {
            result: {
              create: {
                decryptedData: inference,
                proofHash: proofHash,
              }
            }
          }),
        }
      });

      console.log(`[Worker] Inference complete for ${queryId}. proofHash=${proofHash.slice(0, 16)}... Status → RESULT_READY.`);

    } catch (e) {
      console.error("[Worker] Error:", e);
      await sleep(ERROR_BACKOFF_MS);
    }
  }
}

main();
