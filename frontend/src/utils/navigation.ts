import { NavigationTab } from '../types';
import {
  ModuleRouteConfig,
  INTEGRATED_MODULES,
  getModuleFromHash,
  getIntegratedModuleForTopic,
} from './moduleRoutes';

export interface NavigationState {
  tab: NavigationTab;
  moduleId: string | null;
}

const STORAGE_KEY = 'algolearn_current_nav';

/**
 * Resolves initial navigation from pathname, hash, history.state, or sessionStorage.
 * Supports legacy or direct URLs like /topics, #topics, #/topics/Stack,
 * while preparing to keep the visible address bar clean at the origin.
 */
export function parseInitialRoute(): NavigationState {
  if (typeof window === 'undefined') {
    return { tab: 'home', moduleId: null };
  }

  // 1. Check hash first (e.g. #/topics/Stack, #topics, #leaderboard)
  const hash = window.location.hash || '';
  if (hash) {
    const mod = getModuleFromHash(hash);
    if (mod) {
      return { tab: 'topics', moduleId: mod.moduleId };
    }
    const cleanHash = hash.replace(/^[\/#]+/, '').trim().toLowerCase();
    if (cleanHash === 'topics' || cleanHash === 'visualize') {
      return { tab: 'topics', moduleId: null };
    }
    if (cleanHash === 'leaderboard') {
      return { tab: 'leaderboard', moduleId: null };
    }
    if (cleanHash === 'ask-teacher' || cleanHash === 'teachers' || cleanHash === 'ai-tutor') {
      return { tab: 'ask-teacher', moduleId: null };
    }
    if (cleanHash === 'about') {
      return { tab: 'about', moduleId: null };
    }
    if (cleanHash === 'admin') {
      return { tab: 'admin', moduleId: null };
    }
  }

  // 2. Check pathname (e.g. /topics, /leaderboard, /ask-teacher)
  const pathname = window.location.pathname || '/';
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
  if (cleanPath) {
    if (cleanPath.startsWith('topics/')) {
      const slug = cleanPath.slice('topics/'.length).trim();
      const mod = getIntegratedModuleForTopic(slug);
      if (mod) {
        return { tab: 'topics', moduleId: mod.moduleId };
      }
      return { tab: 'topics', moduleId: null };
    }
    if (cleanPath === 'topics' || cleanPath === 'visualize') {
      return { tab: 'topics', moduleId: null };
    }
    if (cleanPath === 'leaderboard') {
      return { tab: 'leaderboard', moduleId: null };
    }
    if (cleanPath === 'ask-teacher' || cleanPath === 'teachers') {
      return { tab: 'ask-teacher', moduleId: null };
    }
    if (cleanPath === 'about') {
      return { tab: 'about', moduleId: null };
    }
    if (cleanPath === 'admin') {
      return { tab: 'admin', moduleId: null };
    }
  }

  // 3. Check history state (preserved across page reload)
  const histState = window.history.state;
  if (histState && histState.tab) {
    return {
      tab: histState.tab,
      moduleId: histState.moduleId || null,
    };
  }

  // 4. Check sessionStorage fallback
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.tab) {
        return {
          tab: parsed.tab,
          moduleId: parsed.moduleId || null,
        };
      }
    }
  } catch (e) {}

  return { tab: 'home', moduleId: null };
}

/**
 * Resolves canonical URL corresponding to a NavigationState.
 * Keeps topic URLs like #/topics/Stack, #/topics/BFS preserved.
 */
export function getRouteUrl(state: NavigationState): string {
  if (state.tab === 'topics') {
    if (state.moduleId) {
      const cfg = INTEGRATED_MODULES[state.moduleId] || getIntegratedModuleForTopic(state.moduleId);
      return cfg ? cfg.routeHash : `#/topics/${state.moduleId}`;
    }
    return '#/topics';
  }
  if (state.tab === 'leaderboard') return '#/leaderboard';
  if (state.tab === 'ask-teacher') return '#/ask-teacher';
  if (state.tab === 'about') return '#/about';
  if (state.tab === 'admin') return '#/admin';
  return '/';
}

/**
 * Synchronizes browser address bar and history state with current navigation.
 * Preserves topic routes and selected module state across refresh and back/forward.
 */
export function syncAddressBar(state: NavigationState, replace = false): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}

  const targetUrl = getRouteUrl(state);
  const currentHash = window.location.hash || '';
  const currentPath = window.location.pathname || '/';

  if (replace) {
    window.history.replaceState(state, '', targetUrl);
  } else {
    const currentHist = window.history.state;
    const sameState =
      currentHist &&
      currentHist.tab === state.tab &&
      currentHist.moduleId === state.moduleId;
    const sameUrl =
      (targetUrl === '/' && (currentPath === '/' && !currentHash)) ||
      (targetUrl !== '/' && (currentHash === targetUrl || `${currentPath}${currentHash}` === targetUrl));

    if (!sameState || !sameUrl) {
      window.history.pushState(state, '', targetUrl);
    }
  }
}

/**
 * Global helper to dispatch navigation events to App.tsx
 */
export function navigateAlgoLearn(tab: NavigationTab, moduleId?: string | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('algolearn_navigate_internal', {
      detail: { tab, moduleId: moduleId || null },
    })
  );
}
