export type ProfileMaturity =
  | "PERFIL_INSUFICIENTE"
  | "PERFIL_INICIAL"
  | "PERFIL_CONFIABLE"
  | "PERFIL_AVANZADO";

export interface LearningRecommendation {
  title: string;
  description: string;
  confidence: string;
}

export interface WeeklyStudyPlanItem {
  day: string;
  title: string;
  focus: string;
  activity: string;
}

export interface LearningProfile {
  maturity: ProfileMaturity;
  documentsAnalyzed: number;
  exercisesDetected: number;
  interactions: number;
  progressPercentage: number;
  canGenerateRecommendations: boolean;
  canGenerateStudyPlan: boolean;
  recommendations: LearningRecommendation[];
  weeklyStudyPlan: WeeklyStudyPlanItem[];
  strengths: string[];
  weaknesses: string[];
}
