// @ts-ignore
import { drizzle } from "drizzle-orm";
// @ts-ignore
import mysql from "mysql2";
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

  const pool = mysql.createPool({
    uri: TIDB_URI,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
      ca: await (globalThis as any).Deno?.readTextFile("./isrgrootx1.pem"),
    },
  });

  const db = drizzle(pool, { schema, mode: "planetscale" });

  // Get a connection from the pool for table creation
  const connection = await pool.getConnection();

  try {
    // Set charset for the connection
    await connection.query("SET NAMES utf8mb4");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      INSERT IGNORE INTO subjects (id, name)
      VALUES (UUID(), 'Tin học')
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS textbook_topics (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        grade int NOT NULL,
        subject_id varchar(36),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS textbook_lessons (
        id varchar(36) PRIMARY KEY,
        topic_id varchar(36) NOT NULL,
        title varchar(255) NOT NULL,
        \`order\` int DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        teacher_id varchar(36) NOT NULL,
        grade int,
        subject varchar(255),
        description text,
        invite_code varchar(50) UNIQUE,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id int PRIMARY KEY AUTO_INCREMENT,
        student_id varchar(36) NOT NULL,
        class_id varchar(36) NOT NULL,
        joined_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignments (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id varchar(36) PRIMARY KEY,
        assignment_id varchar(36) NOT NULL,
        student_id varchar(36) NOT NULL,
        score int,
        answers text,
        is_graded boolean DEFAULT false,
        feedback text,
        submitted_at timestamp DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    dbInstance = db;
    clientInstance = pool;

    console.log("Tables checked and initialized successfully with utf8mb4");
    connection.release();

    return dbInstance;
  } catch (err) {
    logError("Failed to initialize database tables:", err);
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