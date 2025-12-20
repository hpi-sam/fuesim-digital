import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '../.env' });

export default defineConfig({
    out: './drizzle',
    schema: './src/database/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env['DFM_DB_HOST'] ?? 'localhost',
        port: Number(process.env['DFM_DB_PORT']) || 5432,
        user: process.env['DFM_DB_USER'] ?? 'dfm',
        password: process.env['DFM_DB_PASSWORD'] ?? '',
        database: process.env['DFM_DB_NAME'] ?? 'dfm_db',
        ssl: false,
    },
});
