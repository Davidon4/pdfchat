export const runtime = 'nodejs'

import { drizzle } from "drizzle-orm/mysql2";

export const db = drizzle(process.env.NEXT_PUBLIC_DATABASE_URL!);
