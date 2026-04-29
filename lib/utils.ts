import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};

/** Derive a focus score 0–100 from behavior metrics (usable in both client and server) */
export function computeFocusScore(metrics: BehaviorMetrics): number {
  const { pauseCount, tabSwitches, avgResponseDelay, speechActivityRatio } = metrics;

  let score = 100;
  score -= tabSwitches * 12;
  score -= Math.min(pauseCount * 4, 24);
  score -= avgResponseDelay > 8 ? 15 : avgResponseDelay > 5 ? 8 : 0;
  score += Math.round(speechActivityRatio * 10); // engagement bonus

  return Math.max(0, Math.min(100, Math.round(score)));
}
