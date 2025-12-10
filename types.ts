
export type Language = 'en' | 'zh';

export enum FileType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  UNKNOWN = 'UNKNOWN'
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING', // Gemini Analysis
  SANITIZING = 'SANITIZING', // C++ Engine simulation
  RECONSTRUCTING = 'RECONSTRUCTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface SanitizationTask {
  id: string;
  filename: string;
  originalSize: number;
  type: FileType;
  status: ProcessingStatus;
  progress: number; // 0-100
  threatAnalysis?: string; // Result from Gemini
  sanitizationDetails?: string[]; // Steps taken (e.g., "Macros Removed", "Rotated 4x")
  timestamp: number;
  resultFilename?: string;
  downloadUrl?: string;
  base64Data?: string; // Store small file content for reconstruction/preview
  mimeType?: string;
}

export interface StreamConfig {
  id: string;
  name: string;
  protocol: 'ONVIF' | 'GB28181';
  sourceUrl: string;
  targetPort: number;
  status: 'ACTIVE' | 'STOPPED' | 'ERROR';
  codec: 'H264';
  noiseLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fpsCompression: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  module: 'API' | 'ENGINE' | 'STREAM' | 'SYSTEM';
  message: string;
}

export type ViewState = 'DASHBOARD' | 'FILES' | 'STREAMS' | 'LOGS' | 'SETTINGS';
