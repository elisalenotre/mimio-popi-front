export type Pace = "light" | "normal" | "intense";
export type Priority = "studies" | "work" | "balance" | "health" | "other";
export type Energy = "low" | "medium" | "high";

export type OnboardingAnswers = {
  pace: Pace;
  priorities: Priority[];
  energy: Energy;
};