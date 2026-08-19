import { neon } from '@neondatabase/serverless';

// Pure HTTP SQL - no Prisma adapter, no WebSocket, no native binaries
// This is the most reliable way to connect to Neon from Next.js
export const sql = neon(process.env.DATABASE_URL!);



