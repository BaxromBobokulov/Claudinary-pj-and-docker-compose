import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT (non-pooled) connection for migrations.
    // PgBouncer (pooled) breaks DDL operations like migrate deploy.
    url: process.env.DIRECT_URL,
  },
});