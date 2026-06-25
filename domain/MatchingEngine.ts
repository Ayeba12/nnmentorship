export interface MatchingWeights {
  specializationWeight: number;
  rankGapWeight: number;
  commandWeight: number;
  availabilityWeight: number;
  historyWeight: number;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  specializationWeight: 4,
  rankGapWeight: 3,
  commandWeight: 2,
  availabilityWeight: 3,
  historyWeight: 2,
};

export const NAVY_RANKS = [
  "Midshipman",
  "Sub-Lieutenant",
  "Lieutenant",
  "Lieutenant Commander",
  "Commander",
  "Captain",
  "Commodore",
  "Rear Admiral",
  "Vice Admiral",
  "Admiral",
];

export const NAVY_SPECIALIZATIONS = [
  "Navigation & Operations",
  "Marine Engineering",
  "Weapons Electrical",
  "Logistics & Supply",
  "Communications & IT",
  "Naval Intelligence",
  "Hydrography",
  "Medical Services",
];

export const NAVY_COMMANDS = [
  "Western Naval Command (Lagos)",
  "Eastern Naval Command (Calabar)",
  "Central Naval Command (Yenagoa)",
  "Naval Training Command (Lagos)",
  "Logistics Command (Oghara)",
];

export interface MatchProfile {
  rank: string;
  specialization: string;
  command: string;
  availabilityScore: number; // 0 - 10
  historyScore: number;      // 0 - 10
}

export interface ScoreBreakdown {
  specializationScore: number;
  rankGapScore: number;
  commandScore: number;
  availabilityScore: number;
  historyScore: number;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
}

/**
 * Calculates matching compatibility score between a mentee and mentor profile
 */
export function calculateMatchScore(
  mentee: MatchProfile,
  mentor: MatchProfile,
  weights: MatchingWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  // 1. Specialization Match (0 or 10)
  const specMatch = mentee.specialization === mentor.specialization;
  const specializationScore = specMatch ? 10 : 0;

  // 2. Rank Gap Match (0 to 10)
  const menteeRankIdx = NAVY_RANKS.indexOf(mentee.rank);
  const mentorRankIdx = NAVY_RANKS.indexOf(mentor.rank);
  
  let rankGapScore = 0;
  if (mentorRankIdx > menteeRankIdx) {
    const gap = mentorRankIdx - menteeRankIdx;
    // Ideal gap is 2-3 ranks senior.
    if (gap === 2 || gap === 3) {
      rankGapScore = 10;
    } else if (gap === 1 || gap === 4) {
      rankGapScore = 8;
    } else if (gap === 5) {
      rankGapScore = 6;
    } else {
      rankGapScore = 4;
    }
  } else {
    // Mentor must be senior to mentee. If equal or junior, score is 0.
    rankGapScore = 0;
  }

  // 3. Command Match (0 or 10)
  const commandScore = mentee.command === mentor.command ? 10 : 0;

  // 4. Availability Score (0 to 10)
  const availabilityScore = mentor.availabilityScore;

  // 5. History Score (0 to 10)
  const historyScore = mentor.historyScore;

  // Weighted sum calculation
  const totalScore =
    (specializationScore * weights.specializationWeight) +
    (rankGapScore * weights.rankGapWeight) +
    (commandScore * weights.commandWeight) +
    (availabilityScore * weights.availabilityWeight) +
    (historyScore * weights.historyWeight);

  const maxPossibleScore =
    (10 * weights.specializationWeight) +
    (10 * weights.rankGapWeight) +
    (10 * weights.commandWeight) +
    (10 * weights.availabilityWeight) +
    (10 * weights.historyWeight);

  const percentage = Math.round((totalScore / maxPossibleScore) * 100);

  return {
    specializationScore,
    rankGapScore,
    commandScore,
    availabilityScore,
    historyScore,
    totalScore,
    maxPossibleScore,
    percentage,
  };
}
