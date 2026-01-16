export type YearOfStudy = 'YEAR_1' | 'YEAR_2' | 'YEAR_3';

export type Program =
  | 'RN'
  | 'MIDWIFERY'
  | 'PUBLIC_HEALTH'
  | 'MENTAL_HEALTH'
  | 'ONCOLOGY'
  | 'PAEDIATRIC';

export type ContentType = 'PDF' | 'AUDIO' | 'PAST_PAPER' | 'MARKING_KEY';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';

export interface Profile {
  $id: string;
  userId: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  yearOfStudy: YearOfStudy;
  program: Program;
  verified: boolean;
  adminApproved: boolean;
  deviceId: string | null;
  createdAt: string;
}

export interface Subscription {
  $id: string;
  userId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  updatedAt: string;
}

export interface Content {
  $id: string;
  title: string;
  description: string;
  type: ContentType;
  yearOfStudy: YearOfStudy;
  program: Program;
  storageFileId: string;
  durationSeconds?: number;
  createdAt: string;
}

export interface AccessCode {
  $id: string;
  code: string;
  durationDays: number;
  isUsed: boolean;
  usedByUserId: string | null;
  usedAt: string | null;
  createdAt: string;
}

export interface Admin {
  $id: string;
  userId: string;
  email?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalContentItems: number;
  usedAccessCodes: number;
  recentActivity: ActivityItem[];
  subscriptionStatusBreakdown: { name: string; value: number }[];
  newUsersTrend: { name: string; users: number }[];
}

export interface ActivityItem {
  id: string;
  type: 'PROFILE' | 'CONTENT' | 'SUBSCRIPTION';
  description: string;
  timestamp: string;
}
