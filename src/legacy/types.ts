export interface ProcessedFile {
  file: File;
  base64Data?: string; // For PDFs and Images
  textContent?: string; // For TXT files
  mimeType: string;
  id: string;
  category: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type AnalysisType = 'FULL' | 'DELAY' | 'DAMAGE' | 'TENDER';

export type ModelPreference = 'auto' | 'pro' | 'gpt5' | 'flash';

export type AnalysisStrategy = 'precision' | 'balanced' | 'fast';
export type ReportVerbosity = 'concise' | 'standard' | 'detailed';

export interface AnalysisSettings {
  focusKeywords: string;
  excludeSections: string;
  specificSections: string;
  strictMode: boolean;
  modelPreference?: ModelPreference;
  strategy?: AnalysisStrategy;
  minConfidence?: number; // 0-100
  verbosity?: ReportVerbosity;
  requireCitations?: boolean;
}

export interface AnalysisResult {
  markdownText: string;
}

export interface GeminError {
  message: string;
}

export type SubscriptionTier = 'FREE' | 'PRO' | 'PRO_PLUS';

export interface SubscriptionLimits {
  maxFilesPerAnalysis: number;
  maxFileSizeMB: number;
  maxAnalysesPerMonth: number;
  advancedSettings: boolean;
  exportFormats: string[];
  prioritySupport: boolean;
  customThemes: boolean;
  reportCustomization: boolean;
  apiAccess: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  FREE: {
    maxFilesPerAnalysis: 50,
    maxFileSizeMB: 50,
    maxAnalysesPerMonth: 10,
    advancedSettings: false,
    exportFormats: ['txt', 'md'],
    prioritySupport: false,
    customThemes: false,
    reportCustomization: false,
    apiAccess: false,
  },
  PRO: {
    maxFilesPerAnalysis: 100,
    maxFileSizeMB: 100,
    maxAnalysesPerMonth: 100,
    advancedSettings: true,
    exportFormats: ['txt', 'md', 'html'],
    prioritySupport: true,
    customThemes: true,
    reportCustomization: true,
    apiAccess: false,
  },
  PRO_PLUS: {
    maxFilesPerAnalysis: -1, // Unlimited
    maxFileSizeMB: 200,
    maxAnalysesPerMonth: -1, // Unlimited
    advancedSettings: true,
    exportFormats: ['txt', 'md', 'html', 'pdf', 'docx'],
    prioritySupport: true,
    customThemes: true,
    reportCustomization: true,
    apiAccess: true,
  },
};

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  subscriptionExpiresAt: string | null;
}

export interface SubscriptionFeature {
  name: string;
  description: string;
  available: boolean;
}