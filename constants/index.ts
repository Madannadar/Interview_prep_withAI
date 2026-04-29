import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience. Are you ready to begin?",

  // ── STT: Deepgram Nova-2 ─────────────────────────────────────────────────
  // endpointing:300 means Deepgram waits 300ms of silence before finalising a
  // transcript — reduces dropped one-word answers and false early endings.
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
    endpointing: 300,   // ms; default is 10 — too aggressive for interview pauses
  },

  // ── TTS: ElevenLabs ──────────────────────────────────────────────────────
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },

  // ── LLM ──────────────────────────────────────────────────────────────────
  model: {
    provider: "openai",
    model: "gpt-4o",          // faster than gpt-4; better latency for voice
    messages: [
      {
        role: "system",
        content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Interview Guidelines:
Follow the structured question flow:
{{questions}}

Engage naturally & react appropriately:
- Listen actively to responses and acknowledge them before moving forward.
- Ask brief follow-up questions if a response is vague or requires more detail.
- Keep the conversation flowing smoothly while maintaining control.
- Be professional, yet warm and welcoming.

Use official yet friendly language. Keep responses concise. Avoid robotic phrasing.

CRITICAL — Silence & Listening Rules:
- After asking a question, WAIT for the candidate to respond. Do NOT rush to the next question.
- If you detect silence or an unclear response, say: "I didn't quite catch that — could you please repeat your answer?"
- Do NOT end the call due to silence. Only end the call after you have completed all questions AND said a proper farewell.
- The conversation must follow this loop: You ask → Candidate responds → You acknowledge → You ask next question.

Conclude the interview properly:
- Thank the candidate for their time.
- Inform them that the company will reach out soon with feedback.
- End on a polite and positive note.

Keep all responses short and conversational. This is a voice interview.`,
      },
    ],
  },
};


export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.tuple([
    z.object({
      name: z.literal("Communication Skills"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Technical Knowledge"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Problem Solving"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Cultural Fit"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Confidence and Clarity"),
      score: z.number(),
      comment: z.string(),
    }),
  ]),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
  hiringDecision: z.enum(["Strong Hire", "Hire", "Lean Hire", "No Hire"]),
  hiringJustification: z.string(),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "JavaScript", "CSS", "HTML"],
    level: "Intermediate",
    questions: ["What is React?", "Explain the Virtual DOM.", "What are React hooks?"],
    finalized: false,
    createdAt: "2025-03-19T10:00:00Z"
  },
  {
    id: "2",
    userId: "user2",
    role: "Backend Developer",
    type: "Technical",
    techstack: ["Node.js", "Express", "MongoDB", "TypeScript"],
    level: "Advanced",
    questions: ["How does Node.js handle asynchronous operations?", "Explain middleware in Express.", "What are indexes in MongoDB?"],
    finalized: true,
    createdAt: "2025-03-18T15:30:00Z"
  },
  {
    id: "3",
    userId: "user3",
    role: "Machine Learning Engineer",
    type: "Behavioral & Technical",
    techstack: ["Python", "TensorFlow", "scikit-learn", "SQL"],
    level: "Beginner",
    questions: ["What is overfitting in machine learning?", "Explain the difference between supervised and unsupervised learning.", "Describe a project where you applied machine learning."],
    finalized: false,
    createdAt: "2025-03-17T08:45:00Z"
  }
];
