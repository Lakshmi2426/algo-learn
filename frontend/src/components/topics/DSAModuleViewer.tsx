import React, { useState, useEffect, useRef } from 'react';
import { ModuleRouteConfig, INTEGRATED_MODULES } from '../../utils/moduleRoutes';
import { useTheme } from '../../context/ThemeContext';
import { setTopicScore } from '../../utils/topicProgress';

interface DSAModuleViewerProps {
  moduleConfig: ModuleRouteConfig | null;
  onNavigateHome: () => void;
  onNavigateAskTeacher: () => void;
}

export const DSAModuleViewer: React.FC<DSAModuleViewerProps> = ({
  moduleConfig,
  onNavigateHome,
  onNavigateAskTeacher,
}) => {
  const { theme, setTheme } = useTheme();

  // Track loaded state for each module ID
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  // Only mount modules that have been accessed
  const [mountedModules, setMountedModules] = useState<string[]>(() => {
    return moduleConfig?.moduleId ? [moduleConfig.moduleId] : [];
  });

  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  // Background pre-warm topic module endpoints during idle time so Vite pre-compiles them
  useEffect(() => {
    const timer = setTimeout(() => {
      const topicIds = Object.keys(INTEGRATED_MODULES);
      topicIds.forEach((id) => {
        try {
          fetch(`/dsa-modules/${id}/`, { method: 'HEAD' }).catch(() => {});
        } catch {}
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Ensure current active module is in mounted set
  useEffect(() => {
    if (moduleConfig?.moduleId && !mountedModules.includes(moduleConfig.moduleId)) {
      setMountedModules((prev) => [...prev, moduleConfig.moduleId]);
    }
  }, [moduleConfig?.moduleId, mountedModules]);

  // Synchronize theme across all mounted iframes
  const syncIframeTheme = (targetTheme: string) => {
    Object.values(iframeRefs.current).forEach((iframe) => {
      if (!iframe) return;

      try {
        iframe.contentWindow?.postMessage(
          { type: 'ALGOLEARN_THEME_CHANGE', theme: targetTheme },
          '*'
        );
      } catch (e) { }

      try {
        const doc = iframe.contentDocument;
        if (doc && doc.documentElement) {
          if (targetTheme === 'dark') {
            doc.documentElement.classList.add('dark', 'dark-theme');
            doc.documentElement.setAttribute('data-theme', 'dark');
            doc.documentElement.style.colorScheme = 'dark';
            if (doc.body) {
              doc.body.classList.add('dark', 'dark-theme');
              doc.body.setAttribute('data-theme', 'dark');
            }
          } else {
            doc.documentElement.classList.remove('dark', 'dark-theme');
            doc.documentElement.setAttribute('data-theme', 'light');
            doc.documentElement.style.colorScheme = 'light';
            if (doc.body) {
              doc.body.classList.remove('dark', 'dark-theme');
              doc.body.setAttribute('data-theme', 'light');
            }
          }
        }
      } catch (e) { }
    });
  };

  useEffect(() => {
    syncIframeTheme(theme);
  }, [theme]);

  // Handle postMessage navigation & bidirectional theme synchronization
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'ALGOLEARN_NAVIGATE') {
        if (event.data.tab === 'home') {
          onNavigateHome();
        } else if (event.data.tab === 'ask-teacher') {
          onNavigateAskTeacher();
        }
      } else if (event.data.type === 'ALGOLEARN_MODULE_THEME_CHANGED') {
        if (event.data.theme === 'dark' || event.data.theme === 'light') {
          setTheme(event.data.theme);
        }
      } else if (event.data.type === 'ALGOLEARN_TOPIC_PROGRESS_UPDATE') {
        if (event.data.moduleId && typeof event.data.score === 'number') {
          setTopicScore(event.data.moduleId, event.data.score);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onNavigateHome, onNavigateAskTeacher, setTheme]);

  const handleIframeLoad = (modId: string) => {
    setLoadedMap((prev) => ({ ...prev, [modId]: true }));
    syncIframeTheme(theme);

    const iframe = iframeRefs.current[modId];
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const isLogoElement = (el: HTMLElement | null): boolean => {
        if (!el) return false;
        if (el.closest('button[id*="theme"], button[id*="sound"], button[id*="toggle"], button[id*="menu"], #header-hamburger-btn, #topbar-menu-toggle')) {
          return false;
        }

        const sel = el.closest(
          '#header-algolearn-logo, #btn-logo-home, .brand-title-wrap, #topbar-brand-logo-img, .sidebar-brand-left, .algolearn-logo, .topbar-brand-logo-left, [aria-label*="AlgoLearn" i], [aria-label*="Logo" i], [title*="AlgoLearn" i], [title*="Overview" i], a[href="/"]'
        );
        if (sel) return true;

        const txt = (el.textContent || '').trim();
        const parentTxt = (el.parentElement ? el.parentElement.textContent || '' : '').trim();
        if (txt.includes('Algo') && txt.includes('earn')) return true;
        if (txt.includes('YOUR DSA JOURNEY') || parentTxt.includes('YOUR DSA JOURNEY')) return true;
        if (txt === 'AlgoLearn' || parentTxt === 'AlgoLearn') return true;

        return false;
      };

      const isChatElement = (el: HTMLElement | null): boolean => {
        if (!el) return false;
        const sel = el.closest(
          '#ai-bot-floating-button, #floating-chat-bubble-container, #floating-chat-bubble-icon, #floating-chat-badge, #ai-assistant-fab, .ai-fab-btn, #unified-floating-ask-teacher-btn, [aria-label*="Ask a Teacher" i], [aria-label*="Teacher" i], [aria-label*="Assistant" i], [aria-label*="Chatbot" i], [title*="Ask a Teacher" i], [title*="Teacher" i], [title*="Assistant" i], [title*="Chatbot" i]'
        );
        return !!sel;
      };

      doc.addEventListener(
        'click',
        (e: MouseEvent) => {
          const target = e.target as HTMLElement | null;
          if (!target) return;

          if (isLogoElement(target)) {
            e.preventDefault();
            e.stopPropagation();
            onNavigateHome();
            return;
          }

          if (isChatElement(target)) {
            e.preventDefault();
            e.stopPropagation();
            onNavigateAskTeacher();
            return;
          }
        },
        true
      );
    } catch (e) { }
  };

  const bgColor = theme === 'light' ? '#f6f9fe' : '#070b14';
  const currentModId = moduleConfig?.moduleId || '';
  const isCurrentLoaded = currentModId ? loadedMap[currentModId] : true;

  const effectiveModules = Array.from(
    new Set([
      ...mountedModules,
      ...(currentModId ? [currentModId] : []),
    ])
  );

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: bgColor }}
      id={currentModId ? `dsa-module-viewer-${currentModId}` : 'dsa-module-viewer'}
    >
      {currentModId && !isCurrentLoaded && (
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 animate-pulse" />
      )}

      {effectiveModules.map((modId) => {
        const isActive = modId === currentModId;
        const config = INTEGRATED_MODULES[modId] || { moduleId: modId, title: modId };

        return (
          <iframe
            key={modId}
            ref={(el) => {
              iframeRefs.current[modId] = el;
            }}
            src={`/dsa-modules/${modId}/`}
            title={`AlgoLearn - ${config.title}`}
            onLoad={() => handleIframeLoad(modId)}
            className="w-full h-full border-none block m-0 p-0"
            allow="autoplay; fullscreen; clipboard-write; encrypted-media"
            style={{
              backgroundColor: 'transparent',
              display: isActive ? 'block' : 'none',
              opacity: 1,
            }}
          />
        );
      })}
    </div>
  );
};
