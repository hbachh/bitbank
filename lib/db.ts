import { drizzle } from "npm:drizzle-orm@0.35.3/tidb-serverless";
import { connect } from "npm:@tidbcloud/serverless@0.1.0";
import * as schema from "../db/schema.ts";

function logError(message: string, error: unknown) {
  if (error instanceof Error) {
    console.error(message, error.message);
  } else {
    console.error(message, error);
  }
}

const TIDB_URI =
  (globalThis as any).Deno?.env.get("TIDB_DATABASE_URL") ||
  (globalThis as any).Deno?.env.get("TIDB_URI") ||
  "mysql://3xkd3cUNwNkePGY.root:gGDeJVu3bs5NWfq0@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/aiyoungguru";

let dbInstance: any = null;
let clientInstance: any = null;

const createDbConnection = async () => {
  if (dbInstance) return dbInstance;

  try {
    const client = connect({ url: TIDB_URI });
    const db = drizzle(client, { schema });

    // Ensure tables exist (Basic migration logic)
    // Note: In production, it's better to use migrations, but we maintain the current pattern
    await client.execute("SET NAMES utf8mb4");

    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id varchar(36) PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        password text NOT NULL,
        name varchar(255) NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'student',
        grade int,
        school varchar(255),
        email_verified boolean DEFAULT false,
        verification_token varchar(255),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS subjects (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `INSERT IGNORE INTO subjects (id, name) VALUES (UUID(), 'Tin học')`,

      `CREATE TABLE IF NOT EXISTS textbook_topics (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        grade int NOT NULL,
        subject_id varchar(36),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS textbook_lessons (
        id varchar(36) PRIMARY KEY,
        topic_id varchar(36) NOT NULL,
        title varchar(255) NOT NULL,
        \`order\` int DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS questions (
        id varchar(36) PRIMARY KEY,
        type varchar(10) NOT NULL,
        grade int NOT NULL,
        topic_id varchar(36),
        lesson_id varchar(36),
        lesson varchar(255),
        level int,
        content text NOT NULL,
        data text,
        answer text,
        source varchar(255) DEFAULT 'platform',
        is_public boolean DEFAULT true,
        created_by varchar(36),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS classes (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        teacher_id varchar(36) NOT NULL,
        grade int,
        subject varchar(255),
        description text,
        invite_code varchar(50) UNIQUE,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS enrollments (
        id int PRIMARY KEY AUTO_INCREMENT,
        student_id varchar(36) NOT NULL,
        class_id varchar(36) NOT NULL,
        joined_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS assignments (
        id varchar(36) PRIMARY KEY,
        class_id varchar(36),
        teacher_id varchar(36),
        title varchar(255) NOT NULL,
        description text,
        type varchar(20) DEFAULT 'exam',
        duration int,
        start_time timestamp NULL,
        end_time timestamp NULL,
        config text,
        max_attempts int DEFAULT 1,
        question_ids text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS submissions (
        id varchar(36) PRIMARY KEY,
        assignment_id varchar(36) NOT NULL,
        student_id varchar(36) NOT NULL,
        score int,
        answers text,
        is_graded boolean DEFAULT false,
        feedback text,
        submitted_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const query of tableQueries) {
      try {
        await client.execute(query);
      } catch (e) {
        logError("Error executing initialization query:", e);
      }
    }

    dbInstance = db;
    clientInstance = client;

    console.log("Database initialized successfully with TiDB Serverless driver");
    return dbInstance;
  } catch (err) {
    logError("Failed to initialize database connection:", err);
    throw err;
  }
};

export const getDb = async () => {
  if (!dbInstance) {
    await createDbConnection();
  }
  return dbInstance;
};

export const getClient = async () => {
  if (!clientInstance) {
    await createDbConnection();
  }
  return clientInstance;
};
