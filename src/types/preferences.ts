export type MascotMessageIntensity = "discrete" | "normal";

export type Preferences = {
  pace?: string;
  priority?: string;
  energy?: string;

  onboarding_completed?: boolean;

  mascot_message_intensity?: MascotMessageIntensity;
  help_texts_enabled?: boolean;
};