import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Missing DATABASE_URL in environment configuration.");
}

const sql = neon(dbUrl);

export default sql;
