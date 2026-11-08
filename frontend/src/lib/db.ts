import { Pool } from "pg";
import crypto from "crypto";

const defaultDbUrl =
  "postgresql://postgres:KqeKNAUIBBtDIsMD@db.acvonilvfxmjkvpfeqez.supabase.co:5432/postgres";

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL || defaultDbUrl;
  if (!connectionString || connectionString.startsWith("sqlite")) {
    return null;
  }

  if (!pool) {
    let cleanUrl = connectionString;
    if (cleanUrl.startsWith("postgresql+asyncpg://")) {
      cleanUrl = cleanUrl.replace("postgresql+asyncpg://", "postgresql://");
    } else if (cleanUrl.startsWith("postgres+asyncpg://")) {
      cleanUrl = cleanUrl.replace("postgres+asyncpg://", "postgresql://");
    }
    pool = new Pool({
      connectionString: cleanUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 5,
    });
  }
  return pool;
}

export async function upsertUserOnLogin(userData: {
  github_user_id: number;
  github_username: string;
  avatar_url?: string;
  email?: string;
  access_token: string;
}): Promise<string | null> {
  const p = getDbPool();
  if (!p) return null;

  try {
    const client = await p.connect();
    try {
      // 1. Upsert User
      const userCheck = await client.query(
        "SELECT id FROM users WHERE github_user_id = $1",
        [userData.github_user_id]
      );

      let userId = userCheck.rows[0]?.id;
      if (!userId) {
        userId = crypto.randomUUID();
        await client.query(
          `INSERT INTO users (id, github_user_id, github_username, avatar_url, email, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [
            userId,
            userData.github_user_id,
            userData.github_username,
            userData.avatar_url || null,
            userData.email || null,
          ]
        );
      } else {
        await client.query(
          `UPDATE users
           SET github_username = $1, avatar_url = $2, email = $3, updated_at = NOW()
           WHERE id = $4`,
          [
            userData.github_username,
            userData.avatar_url || null,
            userData.email || null,
            userId,
          ]
        );
      }

      // 2. Upsert GitHub connection
      const connCheck = await client.query(
        "SELECT id FROM github_connections WHERE user_id = $1",
        [userId]
      );
      if (connCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO github_connections (id, user_id, encrypted_token_reference, token_scope, connection_status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())`,
          [crypto.randomUUID(), userId, userData.access_token, "repo,read:user,user:email"]
        );
      } else {
        await client.query(
          `UPDATE github_connections
           SET encrypted_token_reference = $1, connection_status = 'ACTIVE', updated_at = NOW()
           WHERE user_id = $2`,
          [userData.access_token, userId]
        );
      }

      // 3. Log audit event
      await client.query(
        `INSERT INTO audit_events (id, user_id, event_type, description, severity, created_at)
         VALUES ($1, $2, 'AUTH_LOGIN', $3, 'INFO', NOW())`,
        [crypto.randomUUID(), userId, `User @${userData.github_username} logged in via GitHub OAuth.`]
      );

      return userId;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Failed to sync user to Supabase DB:", err);
    return null;
  }
}

