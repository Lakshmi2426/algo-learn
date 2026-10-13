import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
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
          '#header-algolearn-logo, #btn-logo-home, .brand-title-wrap, #topbar-brand-logo-img, .sidebar-brand-left, .algolearn-logo, .topbar-brand-logo-left, [aria-label*="AlgoLearn" i], [aria-label*="Logo" i], [title*="AlgoLearn" i], a[href="/"]'
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
        // Never intercept guided solve or game hint controls
        if (el.closest('[title*="Guided Solve" i], [id*="guided-solve" i], .guided-solve-btn')) {
          return false;
        }
        const sel = el.closest(
          '#ai-bot-floating-button, #floating-chat-bubble-container, #floating-chat-bubble-icon, #floating-chat-badge, #ai-assistant-fab, .ai-fab-btn, #unified-floating-ask-teacher-btn, [aria-label*="Ask a Teacher" i], [title*="Ask a Teacher" i]'
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
      const hideInternalChat = () => {
        try {
          const chatElements = doc.querySelectorAll(
            '#ai-bot-floating-button, #floating-chat-bubble-container, #floating-chat-bubble-icon, #floating-chat-badge, #ai-assistant-container, #ai-assistant-fab, .ai-fab-btn, .floating-chatbot-container, [aria-label*="Chatbot" i], [aria-label*="Assistant" i], [title*="Chatbot" i], [title*="Assistant" i], [aria-label*="Ask a Teacher" i], [title*="Ask a Teacher" i]'
          );
          chatElements.forEach((el) => {
            (el as HTMLElement).style.setProperty('display', 'none', 'important');
            (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
            (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
            (el as HTMLElement).style.setProperty('opacity', '0', 'important');
            const parent = el.parentElement;
            if (parent && (parent.className.includes('fixed') || parent.className.includes('bottom-'))) {
              parent.style.setProperty('display', 'none', 'important');
              parent.style.setProperty('visibility', 'hidden', 'important');
              parent.style.setProperty('pointer-events', 'none', 'important');
              parent.style.setProperty('opacity', '0', 'important');
            }
          });
        } catch (e) { }
      };

      try {
        let style = doc.getElementById('algolearn-hide-internal-chat') as HTMLStyleElement | null;
        if (!style) {
          style = doc.createElement('style');
          style.id = 'algolearn-hide-internal-chat';
          doc.head.appendChild(style);
        }
        style.textContent = `
          #ai-bot-floating-button,
          #floating-chat-bubble-container,
          #floating-chat-bubble-icon,
          #floating-chat-badge,
          #ai-assistant-container,
          #ai-assistant-fab,
          .ai-fab-btn,
          .floating-chatbot-container,
          [aria-label*="AI Chatbot" i],
          [aria-label*="AI Assistant" i],
          [aria-label*="Chatbot" i],
          [aria-label*="Assistant" i],
          [aria-label*="Ask a Teacher" i],
          [title*="AI Chatbot" i],
          [title*="AI Assistant" i],
          [title*="Chatbot" i],
          [title*="Assistant" i],
          [title*="Ask a Teacher" i],
          div:has(> [aria-label*="Chatbot" i]),
          div:has(> [aria-label*="Assistant" i]),
          div:has(> #ai-bot-floating-button),
          div:has(> #floating-chat-badge),
          div:has(> #floating-chat-bubble-container),
          div:has(> img[src*="ai-assistant"]),
          div:has(> img[src*="aiboticon"]),
          img[src*="ai-assistant"],
          img[src*="aiboticon"],
          div.fixed.bottom-6.right-6,
          div.fixed.bottom-8.right-8,
          div.fixed.sm\\:bottom-8.sm\\:right-8 {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
          }
        `;
      } catch (e) { }

      hideInternalChat();
      try {
        const chatObserver = new MutationObserver(hideInternalChat);
        chatObserver.observe(doc.body || doc.documentElement, { childList: true, subtree: true });
      } catch (e) { }
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

      {/* Floating Action Button — "Ask a Teacher" (Matching Main Website) */}
      <button
        id="floating-ask-teacher-btn"
        type="button"
        aria-label="Ask a Teacher"
        title="Ask a Teacher — Get DSA help from an expert"
        onClick={onNavigateAskTeacher}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),0_0_16px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_-2px_rgba(37,99,235,0.55),0_0_24px_rgba(124,58,237,0.35)] hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 cursor-pointer select-none"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};
