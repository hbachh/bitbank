export interface Question {
  id?: string;
  type: "TN" | "TF" | "SA"; // Multiple Choice, True/False, Short Answer
  grade: number;
  topic?: string;
  level: 1 | 2 | 3 | 4;
  content: string;
  data?: any; // JSON string of options or details
  correctAnswer?: string;
  createdAt?: Date;
}

export interface ExamMatrix {
  totalQuestions: number;
  levelDistribution: {
    level1: number; // % Nhận biết
    level2: number; // % Thông hiểu
    level3: number; // % Vận dụng
    level4: number; // % Vận dụng cao
  };
  topics?: string[];
}

/**
 * Fisher-Yates Shuffle Algorithm
 * @param array Array to shuffle
 * @returns Shuffled array (new copy)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Select random questions based on matrix
 * @param allQuestions Pool of questions
 * @param matrix Configuration for the exam
 */
export function generateExam(
  allQuestions: Question[],
  matrix: ExamMatrix,
): Question[] {
  // 1. Filter by topic if specified
  const filtered = matrix.topics && matrix.topics.length > 0
    ? allQuestions.filter((q) => q.topic && matrix.topics?.includes(q.topic))
    : allQuestions;

  // 2. Group by level
  const levels: Record<number, Question[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };

  filtered.forEach((q) => {
    if (q.level && q.level >= 1 && q.level <= 4) {
      levels[q.level].push(q);
    }
  });

  // 3. Calculate count for each level
  const count1 = Math.round(
    matrix.totalQuestions * (matrix.levelDistribution.level1 / 100),
  );
  const count2 = Math.round(
    matrix.totalQuestions * (matrix.levelDistribution.level2 / 100),
  );
  const count3 = Math.round(
    matrix.totalQuestions * (matrix.levelDistribution.level3 / 100),
  );
  // Remaining goes to level 4 to ensure total matches
  const count4 = Math.round(matrix.totalQuestions - count1 - count2 - count3);

  // 4. Random pick and shuffle
  const selected: Question[] = [
    ...shuffleArray(levels[1]).slice(0, count1),
    ...shuffleArray(levels[2]).slice(0, count2),
    ...shuffleArray(levels[3]).slice(0, count3),
    ...shuffleArray(levels[4]).slice(0, Math.max(0, count4)),
  ];

  // 5. Final shuffle of the whole exam
  return shuffleArray(selected);
}

/**
 * Shuffle answers for Multiple Choice questions
 */
export function shuffleAnswers(question: Question): Question {
  if (question.type !== "TN" || !question.data) return question;

  try {
    // Basic implementation placeholder
    return question;
  } catch (e) {
    return question;
  }
}
