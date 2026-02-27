import { drizzle } from "npm:drizzle-orm@0.35.3/tidb-serverless";
import { connect } from "npm:@tidbcloud/serverless@0.1.0";
import { sql } from "npm:drizzle-orm@0.35.3";
import * as schema from "../db/schema.ts";
import config from "@/lib/config.ts";

function logError(message: string, error: unknown) {
  if (error instanceof Error) {
    console.error(message, error.message);
    if (error.stack) console.error("Stack trace:", error.stack);
  } else {
    console.error(message, error);
  }
}

const getUri = () => {
  const uri = config.get("TIDB_DATABASE_URL") ||
    config.get("TIDB_URI") ||
    "mysql://3xkd3cUNwNkePGY.root:gGDeJVu3bs5NWfq0@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/aiyoungguru";
  return uri;
};

let dbInstance: any = null;
let clientInstance: any = null;

const createDbConnection = async (retries = 3) => {
  if (dbInstance) return dbInstance;

  const currentUri = getUri();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Connecting to TiDB Serverless (Attempt ${attempt}/${retries})...`);
      console.log(`Using URI: ${currentUri.replace(/:([^:@]+)@/, ":****@")}`); // Log URI with hidden password
      const client = connect({ url: currentUri });
      const db = drizzle(client, { schema });

      // Test connection and set names with a timeout
      console.log("Testing connection with 'SET NAMES utf8mb4'...");
      const testPromise = db.execute(sql.raw("SET NAMES utf8mb4"));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database connection test timed out after 10s")), 10000)
      );
      
      await Promise.race([testPromise, timeoutPromise]);
      console.log("Connection test successful.");

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
        await db.execute(sql.raw(query));
      } catch (e) {
        logError("Error executing initialization query:", e);
      }
    }

    dbInstance = db;
    clientInstance = client;

    console.log("Database initialized successfully with TiDB Serverless driver");
    return dbInstance;
  } catch (err) {
    console.error(`Database connection attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
    
    if (attempt === retries) {
      logError("Final attempt to initialize database connection failed:", err);
      throw err;
    }
    
    // Wait before retrying (exponential backoff)
    const delay = Math.pow(2, attempt) * 1000;
    console.log(`Waiting ${delay}ms before next retry...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
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
