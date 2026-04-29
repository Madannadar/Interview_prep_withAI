'use server'

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { computeFocusScore } from "@/lib/utils";

export async function getInterviewByUserId(userId: string): Promise<Interview[] | null> {
    if (!userId) return [];

    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;
    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getInterviewbyId(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, cognitiveData, behaviorMetrics } = params;

    try {
        const formattedTranscript = transcript
            .map((s: { role: string; content: string }) => `- ${s.role}: ${s.content}\n`)
            .join('');

        const { object } = await generateObject({
            model: google('gemini-2.5-flash', { structuredOutputs: false }),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analyzing a mock interview. Evaluate the candidate thoroughly and honestly — do not be lenient.

Transcript:
${formattedTranscript}

${cognitiveData ? `
Cognitive Analysis Context (use this to enhance your evaluation):
- Detected Approach: ${cognitiveData.approach}
- Overall Confidence Signal: ${Math.round(cognitiveData.confidence * 100)}%
- NLP Signal: ${cognitiveData.signals.nlp.approach} (${Math.round(cognitiveData.signals.nlp.confidence * 100)}% confidence)
- Code Signal: ${cognitiveData.signals.code.approach} (${Math.round(cognitiveData.signals.code.confidence * 100)}% confidence)
- Behavior: ${cognitiveData.signals.behavior.modifier}
` : ''}

Score the candidate from 0 to 100 in these areas (do NOT add other categories):
- **Communication Skills**: Clarity, articulation, structured responses.
- **Technical Knowledge**: Understanding of key concepts for the role.
- **Problem Solving**: Ability to analyze problems and propose solutions.
- **Cultural Fit**: Alignment with company values and job role.
- **Confidence and Clarity**: Confidence in responses, engagement, and clarity.

For hiringDecision, use:
- "Strong Hire": totalScore >= 80 AND high confidence signal AND strong approach
- "Hire": totalScore >= 65 AND reasonable performance
- "Lean Hire": totalScore >= 50 BUT with notable gaps
- "No Hire": totalScore < 50 OR fundamentally weak performance

For hiringJustification, write 1–2 sentences referencing approach quality, confidence level, and signal consistency.`,
            system: "You are a professional interviewer analyzing a mock interview. Evaluate the candidate based on structured categories.",
        });

        // Derive focus score from client-side behavior metrics
        const focusScore = behaviorMetrics ? computeFocusScore(behaviorMetrics) : null;

        const {
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            hiringDecision,
            hiringJustification,
        } = object;

        const feedbackDoc = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            hiringDecision,
            hiringJustification,
            // Cognitive enrichment
            cognitiveApproach: cognitiveData?.approach ?? null,
            cognitiveConfidence: cognitiveData?.confidence ?? null,
            focusScore,
            signalBreakdown: cognitiveData?.signals ?? null,
            createdAt: new Date().toISOString(),
        });

        return { success: true, feedbackId: feedbackDoc.id };

    } catch (error) {
        console.error('[createFeedback] error:', error);
        return { success: false, feedbackId: null };
    }
}

export async function getfeeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<EnhancedFeedback | null> {
    const { interviewId, userId } = params;

    const snapshot = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as EnhancedFeedback;
}