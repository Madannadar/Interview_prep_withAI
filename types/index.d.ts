// ─── Existing Interfaces ─────────────────────────────────────────────────────

interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
  cognitiveData?: CognitiveAnalysisResponse | null;
  behaviorMetrics?: BehaviorMetrics | null;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

// ─── Cognitive Analysis System ────────────────────────────────────────────────

/** Detected algorithmic/problem-solving approach */
type DetectedApproach =
  | "Brute Force"
  | "Sliding Window"
  | "Dynamic Programming"
  | "Divide and Conquer"
  | "Greedy"
  | "BFS/DFS"
  | "Two Pointers"
  | "Binary Search"
  | "Behavioral"
  | "System Design"
  | "Unknown";

/** Per-signal analysis result */
interface SignalResult {
  approach: DetectedApproach;
  confidence: number; // 0.0 – 1.0
}

/** Behavior modifier values */
type BehaviorModifier = "Confident" | "Hesitant" | "Distracted" | "Focused" | "Neutral";

/** Behavior signal from client-side tracking */
interface BehaviorSignal {
  modifier: BehaviorModifier;
  details: {
    avgResponseDelay: number; // seconds
    pauseCount: number;
    tabSwitches: number;
    sessionDurationSeconds: number;
    speechActivityRatio: number; // 0–1, proportion of time user was speaking
  };
}

/** Full cognitive analysis API response */
interface CognitiveAnalysisResponse {
  approach: DetectedApproach;
  confidence: number; // 0.0 – 1.0
  signals: {
    nlp: SignalResult;
    code: SignalResult;
    behavior: BehaviorSignal;
  };
}

/** Client-side behavior metrics collected by useBehaviorTracker */
interface BehaviorMetrics {
  pauseCount: number;
  tabSwitches: number;
  avgResponseDelay: number; // seconds
  sessionDurationSeconds: number;
  speechActivityRatio: number;
}

/** Hiring decision verdict */
type HiringDecision = "Strong Hire" | "Hire" | "Lean Hire" | "No Hire";

/** Enhanced feedback stored in Firestore (extends Feedback) */
interface EnhancedFeedback extends Feedback {
  // Cognitive analysis snapshot
  cognitiveApproach?: DetectedApproach;
  cognitiveConfidence?: number;
  focusScore?: number; // 0–100
  hiringDecision?: HiringDecision;
  signalBreakdown?: {
    nlp: SignalResult;
    code: SignalResult;
    behavior: BehaviorSignal;
  };
}

/** Props for the live cognitive insight panel */
interface CognitiveInsightPanelProps {
  data: CognitiveAnalysisResponse | null;
  isLoading: boolean;
}
