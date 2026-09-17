import mongoose, { Document, Schema } from 'mongoose';

export interface IGitHubData {
  connected: boolean;
  username: string;
  accessToken?: string;
  lastSyncedAt?: Date;
  reposCount: number;
  weeklyCommits: number;
  totalCommitsYear: number;
  recentRepos: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    updatedAt: string;
    url: string;
  }>;
  languages: Array<{ name: string; percentage: number }>;
}

export interface ILeetCodeData {
  connected: boolean;
  username: string;
  lastSyncedAt?: Date;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  streak: number;
  totalActiveDays: number;
  recentSubmissions: Array<{
    id: string;
    title: string;
    titleSlug: string;
    timestamp: number;
  }>;
  topicStats: Array<{
    tagName: string;
    problemsSolved: number;
  }>;
  weaknessAnalysis?: {
    summary: string;
    recommendedTopics: string[];
    suggestedProblemCount: number;
  };
}

export interface ISpotifyData {
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  lastSyncedAt?: Date;
  currentTrack?: {
    title: string;
    artist: string;
    album: string;
    albumArt?: string;
    isPlaying: boolean;
    durationMs: number;
    progressMs: number;
  };
}

export interface IIntegration extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  github: IGitHubData;
  leetcode: ILeetCodeData;
  spotify: ISpotifyData;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    github: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: '' },
      accessToken: { type: String },
      lastSyncedAt: { type: Date },
      reposCount: { type: Number, default: 0 },
      weeklyCommits: { type: Number, default: 0 },
      totalCommitsYear: { type: Number, default: 0 },
      recentRepos: [{ type: Schema.Types.Mixed }],
      languages: [{ type: Schema.Types.Mixed }]
    },
    leetcode: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: '' },
      lastSyncedAt: { type: Date },
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      totalActiveDays: { type: Number, default: 0 },
      recentSubmissions: [{ type: Schema.Types.Mixed }],
      topicStats: [{ type: Schema.Types.Mixed }],
      weaknessAnalysis: { type: Schema.Types.Mixed }
    },
    spotify: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String },
      refreshToken: { type: String },
      expiresAt: { type: Date },
      lastSyncedAt: { type: Date },
      currentTrack: { type: Schema.Types.Mixed }
    }
  },
  { timestamps: true }
);

export const Integration = mongoose.model<IIntegration>('Integration', IntegrationSchema);
