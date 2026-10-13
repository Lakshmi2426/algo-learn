/**
 * Individual User Identification & Data Isolation Utility for Hashing - AlgoLearn
 *
 * Ensures that when the website link is shared with different users,
 * each user's learning progress, points balance, deductions, and quiz submissions
 * are tracked independently and persistently without any cross-user contamination.
 */

const STORAGE_ACTIVE_USER_ID = 'hash_quest_user_device_id_v2';

class UserManager {
  private currentUserId: string = 'user_default';

  constructor() {
    this.initUser();
  }

  private sanitizeId(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
  }

  private getUrlUserParam(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Check window.location.search (?user=... or ?userId=... etc.)
      const searchParams = new URLSearchParams(window.location.search);
      const searchVal =
        searchParams.get('user') ||
        searchParams.get('userId') ||
        searchParams.get('student') ||
        searchParams.get('studentId') ||
        searchParams.get('username') ||
        searchParams.get('uid');
      if (searchVal) return searchVal.trim();

      // 2. Check window.location.hash (e.g. #/overview?user=... or #/quiz?userId=...)
      const hash = window.location.hash;
      const hashQuestionIdx = hash.indexOf('?');
      if (hashQuestionIdx !== -1) {
        const hashParams = new URLSearchParams(hash.substring(hashQuestionIdx));
        const hashVal =
          hashParams.get('user') ||
          hashParams.get('userId') ||
          hashParams.get('student') ||
          hashParams.get('studentId') ||
          hashParams.get('username') ||
          hashParams.get('uid');
        if (hashVal) return hashVal.trim();
      }
    } catch {
      // Ignore URL parsing errors
    }

    return null;
  }

  private initUser() {
    if (typeof window === 'undefined') return;

    // 1. If link has user identifier parameter (e.g. ?user=...), use it
    const urlUser = this.getUrlUserParam();
    if (urlUser) {
      const sanitized = this.sanitizeId(urlUser);
      if (sanitized) {
        this.currentUserId = sanitized;
        try {
          localStorage.setItem(STORAGE_ACTIVE_USER_ID, sanitized);
        } catch {
          // Ignore
        }
        this.migrateLegacyDataIfNeeded(sanitized);
        return;
      }
    }

    // 2. Check if this browser already has an existing unique user ID
    try {
      const existingId = localStorage.getItem(STORAGE_ACTIVE_USER_ID);
      if (existingId && existingId.trim()) {
        this.currentUserId = existingId.trim();
        this.migrateLegacyDataIfNeeded(this.currentUserId);
        return;
      }
    } catch {
      // Ignore
    }

    // 3. Generate a fresh, unique individual ID for this user/device
    const newUniqueId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.currentUserId = newUniqueId;
    try {
      localStorage.setItem(STORAGE_ACTIVE_USER_ID, newUniqueId);
    } catch {
      // Ignore
    }

    // Migrate any legacy un-namespaced data to this user so nothing is lost
    this.migrateLegacyDataIfNeeded(newUniqueId);
  }

  /**
   * Seamlessly migrate legacy un-namespaced keys so pre-existing user progress
   * is preserved for this browser.
   */
  private migrateLegacyDataIfNeeded(targetUserId: string) {
    if (typeof localStorage === 'undefined') return;
    try {
      const targetProgKey = this.getProgressKey(targetUserId);
      const targetPtsKey = this.getPointsKey(targetUserId);
      const targetQuizAnswersKey = this.getQuizAnswersKey(targetUserId);
      const targetQuizSubKey = this.getQuizSubmittedKey(targetUserId);

      // 1. Progress migration
      if (!localStorage.getItem(targetProgKey)) {
        const legacyProg = localStorage.getItem('hash_quest_field_notes_progress_v2');
        if (legacyProg) {
          localStorage.setItem(targetProgKey, legacyProg);
        }
      }

      // 2. Points migration
      if (!localStorage.getItem(targetPtsKey)) {
        const legacyPts = localStorage.getItem('hash_quest_points_system_v2');
        if (legacyPts) {
          localStorage.setItem(targetPtsKey, legacyPts);
        }
      }

      // 3. Quiz answers migration
      if (!localStorage.getItem(targetQuizAnswersKey)) {
        const legacyAns = localStorage.getItem('hash_quest_quiz_answers_v3');
        if (legacyAns) {
          localStorage.setItem(targetQuizAnswersKey, legacyAns);
        }
      }

      // 4. Quiz submitted migration
      if (!localStorage.getItem(targetQuizSubKey)) {
        const legacySub = localStorage.getItem('hash_quest_quiz_submitted_v3');
        if (legacySub) {
          localStorage.setItem(targetQuizSubKey, legacySub);
        }
      }
    } catch {
      // Ignore migration errors
    }
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  /**
   * Namespaced Storage Key Generators for Hashing
   */
  public getProgressKey(userId?: string): string {
    const id = (userId || this.getCurrentUserId()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `hash_user_progress_${id}`;
  }

  public getPointsKey(userId?: string): string {
    const id = (userId || this.getCurrentUserId()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `hash_user_points_${id}`;
  }

  public getQuizAnswersKey(userId?: string): string {
    const id = (userId || this.getCurrentUserId()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `hash_user_quiz_answers_${id}`;
  }

  public getQuizSubmittedKey(userId?: string): string {
    const id = (userId || this.getCurrentUserId()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `hash_user_quiz_submitted_${id}`;
  }

  public getQuizStartedKey(userId?: string): string {
    const id = (userId || this.getCurrentUserId()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `hash_user_quiz_started_${id}`;
  }

  public getQuizTimerKey(userId?: string): string {
    const id = (userId || this.getCurrentUserId()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `hash_user_quiz_timer_${id}`;
  }
}

export const userManager = new UserManager();
