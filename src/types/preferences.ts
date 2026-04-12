export type MascotMessageIntensity = "discrete" | "normal";

export type StatusPreferences = {
  fatigue?: number | null;
  stress?: number | null;
  joie?: number | null;
  sante?: number | null;
  motivation?: number | null;
  finances?: number | null;
};

export type Preferences = {
  pace?: string;
  priority?: string;
  energy?: string;

  onboarding_completed?: boolean;

  mascot_message_intensity?: MascotMessageIntensity;
  help_texts_enabled?: boolean;
  statuses?: StatusPreferences;
  statuses_day_key?: string;
  statuses_daily_base?: number;
};