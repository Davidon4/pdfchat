import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import type { Config } from "drizzle-kit";

export default {
  driver: "pg",
  schema: './db/schema.ts',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
} satisfies Config;;