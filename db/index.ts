import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
  
const poolConnection = mysql.createPool({
  host: "host",
  user: "Juggernaut",
  database: "pdfchatdb",
});
export const db = drizzle({ client: poolConnection });

// or if you need client connection
async function main() {
  const connection = await mysql.createConnection({
    host: "host",
    user: "Juggernaut",
    database: "pdfchat",
  });
  const db = drizzle({ client: connection });
}
main();
