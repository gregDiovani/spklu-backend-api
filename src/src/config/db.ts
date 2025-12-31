import { Pool } from "pg";
import { env } from "./env";

export const db = new Pool({
    connectionString: env.DB_URL,

});




// optional: logging
db.on("connect", () => {
    console.log("✅ PostgreSQL connected");
});

db.on("error", (err) => {
    console.error("❌ PostgreSQL error", err);
});