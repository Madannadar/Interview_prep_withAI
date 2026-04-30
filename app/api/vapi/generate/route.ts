import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";

// ── Server-side idempotency guard ─────────────────────────────────────────────
// Tracks in-flight generation requests to prevent quota spikes from Vapi
// retries or duplicate webhook calls. Key = `${userid}:${role}:${level}`.
const inFlightRequests = new Map<string, number>(); // key → timestamp
const IN_FLIGHT_TTL_MS = 10_000; // 10 s cooldown between identical requests

export async function GET() {
    return new Response(JSON.stringify({ success: true, data: "Thank You!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(request: Request) {
    try {
        const { type, role, level, techstack, amount, userid } = await request.json();

        // ── Deduplication check ───────────────────────────────────────────────
        const requestKey = `${userid}:${role}:${level}`;
        const now = Date.now();
        const lastRequest = inFlightRequests.get(requestKey);

        if (lastRequest && now - lastRequest < IN_FLIGHT_TTL_MS) {
            const waitMs = IN_FLIGHT_TTL_MS - (now - lastRequest);
            console.warn(`⚠️ [generate] Duplicate request blocked for key="${requestKey}" — retry in ${waitMs}ms`);
            return new Response(
                JSON.stringify({ success: false, error: "Duplicate request — please wait before retrying" }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }
        inFlightRequests.set(requestKey, now);
        // Auto-clean after TTL to avoid memory leaks
        setTimeout(() => inFlightRequests.delete(requestKey), IN_FLIGHT_TTL_MS);

        console.log("🚨 AI CALL TRIGGERED — generateText", { timestamp: now, requestKey });

        const response = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: `Prepare questions for a job interview.
                The job role is ${role}.
                The job experience level is ${level}.
                The tech stack used in the job is: ${techstack}.
                The focus between behavioural and technical questions should lean towards: ${type}.
                The amount of questions required is: ${amount}.
                Please return only the questions, without any additional text.
                The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
                Return the questions formatted like this:
                ["Question 1", "Question 2", "Question 3"]
                
                Thank you! <3
            `,
        });

        let questions;
        try {
            questions = JSON.parse(response.text);
        } catch (err) {
            console.error("Failed to parse AI response:", response.text);
            return new Response(
                JSON.stringify({ success: false, error: "Invalid AI response format" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const interview = {
            role,
            type,
            level,
            techstack: techstack.split(","),
            questions,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        console.log("Saving to Firebase:", interview);
        await db.collection("interviews").add(interview);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error in POST /api/generate:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
