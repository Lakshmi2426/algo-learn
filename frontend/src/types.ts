export type Theme = 'light' | 'dark';

export type NavigationTab = 
  | 'home' 
  | 'topics' 
  | 'leaderboard' 
  | 'ask-teacher' 
  | 'about'
  | 'admin';

export type UserRole = 'student' | 'admin';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DSATopicSubtopic {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  keyOperations?: { name: string; time: string; space: string }[];
  concepts?: string[];
}

export interface DSATopic {
  id: string;
  title: string;
  category: 'Linear' | 'Tree & Graph' | 'Algorithms' | 'Advanced';
  difficulty: Difficulty;
  shortDescription: string;
  fullDescription: string;
  conceptsCount: number;
  challengesCount: number;
  progress: number; // 0 to 100
  accentColor: string;
  borderGradient: string;
  bgGradient: string;
  iconName: string;
  keyOperations: { name: string; time: string; space: string }[];
  algorithms: string[];
  subtopics?: DSATopicSubtopic[];
  featuredOnHome?: boolean;
  gameUrl?: string;
  externalUrl?: string;
}

export interface StudentProgressRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  regdNo?: string;
  branch?: string;
  topicsStarted: number;
  topicsCompleted: number;
  overallProgress: number; // percentage
  lastActive: string;
  streak: number;
  currentStage: string;
  xp?: number;
  exploredTopics: {
    id: string;
    title: string;
    progress: number;
    lastAccessed: string;
    status: 'completed' | 'in_progress' | 'not_started';
  }[];
  recentActivities: {
    id: string;
    title: string;
    type: 'concept_read' | 'visualization_run' | 'teacher_question' | 'quiz_completed';
    timestamp: string;
  }[];
}

export interface SimulationStep {
  stepIndex: number;
  description: string;
  arrayState?: number[];
  highlightIndices?: number[];
  comparingIndices?: number[];
  sortedIndices?: number[];
  treeNodes?: { id: number; value: number; state: 'default' | 'active' | 'visited' | 'found' }[];
  activeCodeLine?: number;
  pointers?: { [key: string]: number };
  explanation: string;
}

export interface DSAGame {
  id: string;
  title: string;
  subtitle: string;
  concept: string;
  difficulty: Difficulty;
  estimatedTime: string;
  icon: string;
  accentColor: string;
  bgGradient: string;
  xpReward: number;
  playersCount: string;
  rating: number;
  description: string;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  streak: number;
  level: number;
  tier: 'Diamond' | 'Platinum' | 'Gold';
  countryCode: string;
  solvedCount: number;
  badgeTitle: string;
  isCurrentUser?: boolean;
  regdNo?: string;
  topicsCompleted?: number;
  topicsStarted?: number;
  overallProgress?: number;
  email?: string;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  regdNo?: string;
  branch?: string;
  xp: number;
  level: number;
  streak: number;
  problemsSolved: number;
  topicsMastered: number;
  weeklyGoalMinutes: number;
  weeklyProgressMinutes: number;
  joinedDate: string;
  badges: AchievementBadge[];
  recentActivity: {
    id: string;
    action: string;
    target: string;
    xpEarned: number;
    timestamp: string;
  }[];
  exploredTopics?: {
    id: string;
    title: string;
    progress: number;
    lastAccessed: string;
    status: 'completed' | 'in_progress' | 'not_started';
  }[];
}

// ─── Teacher / Ask a Teacher Types ───────────────────────────────────────────

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  subject: string;
  avatarInitials: string;
  avatarGradient: string;
  avatarUrl?: string;
  description?: string;
  createdAt?: string;
}

export type ConversationStatus = 'Pending' | 'Answered';

export interface TeacherMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderRole: 'student' | 'teacher';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface StudentQuestion {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  topicId?: string;
  topicTitle?: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: TeacherMessage[];
}
