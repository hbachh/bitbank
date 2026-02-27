// @ts-ignore
import {
  boolean,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
// @ts-ignore
} from "npm:drizzle-orm@^0.35.3/mysql-core";

export const subjects = mysqlTable("subjects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const textbookTopics = mysqlTable("textbook_topics", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  grade: int("grade").notNull(),
  subjectId: varchar("subject_id", { length: 36 }), // Foreign key to subjects
  createdAt: timestamp("created_at").defaultNow(),
});

export const textbookLessons = mysqlTable("textbook_lessons", {
  id: varchar("id", { length: 36 }).primaryKey(),
  topicId: varchar("topic_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = mysqlTable("questions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  type: varchar("type", { length: 10 }).notNull(), // 'TN', 'TF', 'SA'
  grade: int("grade").notNull(),
  topicId: varchar("topic_id", { length: 36 }), // Foreign key to textbookTopics
  lessonId: varchar("lesson_id", { length: 36 }), // Foreign key to textbookLessons
  lesson: varchar("lesson", { length: 255 }), // Legacy or custom lesson name
  level: int("level"),
  content: text("content").notNull(),
  data: text("data"), // JSON string (options for TN, etc.)
  answer: text("answer"), // Expected answer for TN/TF, or reference answer for SA
  source: varchar("source", { length: 255 }).default("platform"),
  isPublic: boolean("is_public").default(true),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = mysqlTable("classes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  grade: int("grade"),
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  inviteCode: varchar("invite_code", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = mysqlTable("enrollments", {
  id: int("id").primaryKey().autoincrement(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const assignments = mysqlTable("assignments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  classId: varchar("class_id", { length: 36 }),
  teacherId: varchar("teacher_id", { length: 36 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).default("exam"),
  duration: int("duration"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  config: text("config"), // JSON configuration for question counts
  maxAttempts: int("max_attempts").default(1),
  questionIds: text("question_ids"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = mysqlTable("submissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  score: int("score"),
  answers: text("answers"), // JSON string of student responses and teacher grading
  isGraded: boolean("is_graded").default(false),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  grade: int("grade"),
  school: varchar("school", { length: 255 }), // New field for identifying schools
  emailVerified: boolean("email_verified").default(false), // New field for email verification
  verificationToken: varchar("verification_token", { length: 255 }), // New field for email verification token
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
});
