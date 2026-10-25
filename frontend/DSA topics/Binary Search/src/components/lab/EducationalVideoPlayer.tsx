import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Video,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Upload,
  RefreshCw,
  Layers,
  ArrowRight,
  ArrowDown,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Film,
  X,
} from 'lucide-react';
import { soundEffects } from '../../services/sound';
import { LessonData, EducationalScene } from '../../data/labVideoData';

export type { LessonData, EducationalScene };

interface EducationalVideoPlayerProps {
  activeLesson: LessonData;
  customVideoUrl: string | null;
  customVideoName: string | null;
  autoPlayTrigger?: number;
  onUploadClick: () => void;
  onLessonComplete?: (lessonId: number) => void;
}

export const EducationalVideoPlayer: React.FC<EducationalVideoPlayerProps> = ({
  activeLesson,
  customVideoUrl,
  customVideoName,
  autoPlayTrigger,
  onUploadClick,
  onLessonComplete,
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'simulation'>('video');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(activeLesson.duration);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHoveringVideo, setIsHoveringVideo] = useState<boolean>(false);
  const [fsControlsVisible, setFsControlsVisible] = useState<boolean>(true);
  const [isHoveringControls, setIsHoveringControls] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(performance.now());
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentSceneIdRef = useRef<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-tier candidate URLs for bulletproof video playback
  const fallbackCandidates = useMemo(() => {
    if (customVideoUrl) return [customVideoUrl];
    const defaultSrc = activeLesson.videoSrc || '';
    const filename = activeLesson.filename || (activeLesson.id === 1 ? 'Binary Search.mp4' : 'Binary Search Algorithm.mp4');
    return [
      defaultSrc,
      `/videos/${filename}`,
      `/Videos/${filename}`,
      `/dsa-modules/binary-search/assets/${activeLesson.id === 1 ? 'Binary Search-DLaKg1Jj.mp4' : 'Binary Search Algorithm-DuSf9mNE.mp4'}`,
      `./Videos/${filename}`,
    ].filter(Boolean);
  }, [customVideoUrl, activeLesson.videoSrc, activeLesson.filename, activeLesson.id]);

  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const effectiveVideoSrc = fallbackCandidates[Math.min(candidateIndex, fallbackCandidates.length - 1)];
  const isVideoMode = viewMode === 'video' && !!effectiveVideoSrc;
  const totalDuration = videoDuration > 0 ? videoDuration : activeLesson.duration;

  // Sync lesson switch
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    currentSceneIdRef.current = -1;
    setVideoDuration(activeLesson.duration);
    setCandidateIndex(0);

    if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = 0;
      nativeVideoRef.current.playbackRate = playbackSpeed;
    }
  }, [activeLesson.id, customVideoUrl]);

  // Speech synthesis & web audio setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
  }, []);

  // Web Audio SFX generator for simulation mode
  const playSfx = useCallback(
    (type: 'push' | 'pop' | 'peek' | 'transition' | 'warning') => {
      if (isMuted || volume === 0 || !audioCtxRef.current) return;
      try {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        const currentVol = isMuted ? 0 : volume * 0.15;

        if (type === 'push') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(840, now + 0.15);
          gain.gain.setValueAtTime(currentVol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'pop') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(750, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.16);
          gain.gain.setValueAtTime(currentVol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'peek') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(980, now + 0.12);
          gain.gain.setValueAtTime(currentVol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'warning') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
          gain.gain.setValueAtTime(currentVol * 0.9, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.25);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(580, now + 0.1);
          gain.gain.setValueAtTime(currentVol * 0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.14);
        }
      } catch {
        // Fallback gracefully
      }
    },
    [isMuted, volume]
  );

  // Find active scene
  const currentSceneIndex = activeLesson.scenes.findIndex(
    (s) => currentTime >= s.timeStart && currentTime < s.timeEnd
  );
  const activeScene =
    activeLesson.scenes[currentSceneIndex >= 0 ? currentSceneIndex : activeLesson.scenes.length - 1];

  // Speech narration when running simulation mode
  useEffect(() => {
    if (isVideoMode || !isPlaying || isMuted || !synthRef.current) return;
    if (activeScene && activeScene.id !== currentSceneIdRef.current) {
      currentSceneIdRef.current = activeScene.id;
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(activeScene.narration);
      utterance.rate = 1.05 * playbackSpeed;
      utterance.volume = isMuted ? 0 : volume;

      const voices = synthRef.current.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      synthRef.current.speak(utterance);

      if (activeScene.type === 'push') playSfx('push');
      else if (activeScene.type === 'pop') playSfx('pop');
      else if (activeScene.type === 'peek') playSfx('peek');
      else if (activeScene.type === 'overflow' || activeScene.type === 'underflow') playSfx('warning');
      else playSfx('transition');
    }
  }, [activeScene, isPlaying, isMuted, playbackSpeed, volume, isVideoMode, playSfx]);

  // Simulation mode RAF loop
  useEffect(() => {
    if (isVideoMode) return;

    if (isPlaying) {
      lastTimestampRef.current = performance.now();

      const loop = (timestamp: number) => {
        const delta = (timestamp - lastTimestampRef.current) / 1000;
        lastTimestampRef.current = timestamp;

        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= totalDuration) {
            setIsPlaying(false);
            if (synthRef.current) synthRef.current.cancel();
            if (onLessonComplete) onLessonComplete(activeLesson.id);
            return totalDuration;
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (synthRef.current) synthRef.current.cancel();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDuration, isVideoMode, onLessonComplete, activeLesson.id]);

  // Video element event listeners
  const handleNativeTimeUpdate = () => {
    if (nativeVideoRef.current) {
      setCurrentTime(nativeVideoRef.current.currentTime);
      if (nativeVideoRef.current.ended) {
        setIsPlaying(false);
        if (onLessonComplete) onLessonComplete(activeLesson.id);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (nativeVideoRef.current) {
      const dur = nativeVideoRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setVideoDuration(dur);
      }
      nativeVideoRef.current.volume = isMuted ? 0 : volume;
      nativeVideoRef.current.muted = isMuted;
      nativeVideoRef.current.playbackRate = playbackSpeed;
    }
  };

  // Fullscreen controls
  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setFsControlsVisible(true);
    resetInactivityTimer();
    if (containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setFsControlsVisible(true);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Handle external autoPlay trigger (e.g. from WATCH LESSON buttons)
  useEffect(() => {
    if (autoPlayTrigger && autoPlayTrigger > 0) {
      setIsPlaying(true);
      if (nativeVideoRef.current) {
        nativeVideoRef.current.currentTime = 0;
        nativeVideoRef.current.play().catch(() => {});
      }
    }
  }, [autoPlayTrigger]);

  // Play / Pause handler
  const handleTogglePlay = () => {
    soundEffects.playClick();
    if (isVideoMode && nativeVideoRef.current) {
      if (isPlaying) {
        nativeVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        if (nativeVideoRef.current.ended || currentTime >= totalDuration - 0.2) {
          nativeVideoRef.current.currentTime = 0;
          setCurrentTime(0);
        }
        nativeVideoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    } else {
      if (!isPlaying && currentTime >= totalDuration) {
        setCurrentTime(0);
        currentSceneIdRef.current = -1;
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Restart video
  const handleRestart = () => {
    soundEffects.playClick();
    setCurrentTime(0);
    currentSceneIdRef.current = -1;
    if (isVideoMode && nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = 0;
      nativeVideoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {});
    } else {
      setIsPlaying(true);
    }
  };

  // Step 5s backward only (forward seeking is strictly prevented per spec)
  const handleSkipTime = (seconds: number) => {
    // Only allow backward skip (negative seconds)
    if (seconds >= 0) return;
    soundEffects.playClick();
    const newTime = Math.max(0, currentTime + seconds);
    setCurrentTime(newTime);
    currentSceneIdRef.current = -1;
    if (isVideoMode && nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = newTime;
    }
  };

  // Seek timeline: only allow seeking backward behind current watched time
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    // Disallow seeking forward past the current playback time
    if (seekTime > currentTime) return;
    setCurrentTime(seekTime);
    currentSceneIdRef.current = -1;
    if (isVideoMode && nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = seekTime;
    }
  };

  // Scene jumper: only allow jumping to previous scenes
  const handleJumpScene = (sceneIndex: number) => {
    if (sceneIndex >= 0 && sceneIndex < activeLesson.scenes.length) {
      const targetTime = activeLesson.scenes[sceneIndex].timeStart;
      // Disallow skipping ahead to future scenes
      if (targetTime > currentTime) return;
      soundEffects.playClick();
      setCurrentTime(targetTime);
      currentSceneIdRef.current = -1;
      if (isVideoMode && nativeVideoRef.current) {
        nativeVideoRef.current.currentTime = targetTime;
      }
      setIsPlaying(true);
    }
  };

  // Speed change
  const handleSpeedChange = (speed: number) => {
    soundEffects.playClick();
    setPlaybackSpeed(speed);
    if (nativeVideoRef.current) {
      nativeVideoRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    if (nativeVideoRef.current) {
      nativeVideoRef.current.volume = val;
      nativeVideoRef.current.muted = false;
    }
  };

  const handleToggleMute = useCallback(() => {
    soundEffects.playClick();
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (nativeVideoRef.current) {
        nativeVideoRef.current.muted = nextMuted;
      }
      return nextMuted;
    });
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    soundEffects.playClick();
    if (!containerRef.current) return;
    if (!document.fullscreenElement && !isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      setFsControlsVisible(true);
      if (isFs) {
        resetInactivityTimer();
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut listeners when focused or in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkipTime(-5);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isVideoMode, totalDuration, currentTime, isFullscreen, exitFullscreen, toggleFullscreen, handleToggleMute]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const seekFromPointer = useCallback(
    (clientX: number) => {
      if (!progressTrackRef.current) return;
      const rect = progressTrackRef.current.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = rect.width > 0 ? clampedX / rect.width : 0;
      const targetSeekTime = Math.max(0, Math.min(ratio * totalDuration, totalDuration));
      
      // Strict requirement: student must watch without skipping forward
      // Only permit rewinding / seeking backward
      if (targetSeekTime > currentTime) {
        return;
      }

      setCurrentTime(targetSeekTime);
      currentSceneIdRef.current = -1;
      if (isVideoMode && nativeVideoRef.current) {
        nativeVideoRef.current.currentTime = targetSeekTime;
      }
    },
    [totalDuration, isVideoMode, currentTime]
  );

  // Auto-hide fullscreen controls timer logic
  const resetInactivityTimer = useCallback(() => {
    setFsControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Only auto-hide if in fullscreen AND actively playing AND not dragging AND not hovering over controls
    if (isFullscreen && isPlaying && !isHoveringControls && !isDragging) {
      hideTimerRef.current = setTimeout(() => {
        setFsControlsVisible(false);
      }, 2500);
    }
  }, [isFullscreen, isPlaying, isHoveringControls, isDragging]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isFullscreen, isPlaying, isHoveringControls, isDragging, resetInactivityTimer]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    resetInactivityTimer();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    seekFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    resetInactivityTimer();
    seekFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      resetInactivityTimer();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // Video screen click handler:
  // - In fullscreen: clicking the video screen area while playing toggles control visibility
  //   without pausing or restarting playback, and without exiting fullscreen.
  //   Clicking while paused starts playback.
  // - In normal mode: clicking toggles play/pause.
  const handleVideoAreaClick = (e: React.MouseEvent) => {
    if (isFullscreen) {
      if (isPlaying) {
        setFsControlsVisible((prev) => {
          const next = !prev;
          if (next) {
            resetInactivityTimer();
          } else {
            if (hideTimerRef.current) {
              clearTimeout(hideTimerRef.current);
              hideTimerRef.current = null;
            }
          }
          return next;
        });
      } else {
        handleTogglePlay();
      }
    } else {
      handleTogglePlay();
    }
  };

  const progressPercent =
    totalDuration > 0 ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100)) : 0;

  const sceneProgress = activeScene
    ? Math.min(
        1,
        Math.max(0, (currentTime - activeScene.timeStart) / (activeScene.timeEnd - activeScene.timeStart || 1))
      )
    : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={() => {
        if (isFullscreen) {
          resetInactivityTimer();
        }
      }}
      onTouchStart={() => {
        if (isFullscreen) {
          resetInactivityTimer();
        }
      }}
      onTouchMove={() => {
        if (isFullscreen) {
          resetInactivityTimer();
        }
      }}
      className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen
          ? `fixed inset-0 z-50 rounded-none w-screen h-screen bg-black p-0 flex flex-col justify-between ${
              !fsControlsVisible && isPlaying ? 'cursor-none' : 'cursor-default'
            }`
          : 'p-5 sm:p-7'
      }`}
    >
      {/* ─── 1. VIDEO HEADER BAR (Normal Mode) ─── */}
      {!isFullscreen && (
        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/70 dark:border-blue-800/70 shadow-2xs shrink-0">
              <Video className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-400 uppercase">
                  {activeLesson.lessonNumber}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                  <Film className="w-2.5 h-2.5" /> Source Video
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                {activeLesson.title}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. VIDEO DISPLAY SCREEN / INTERACTIVE STAGE ─── */}
      <div
        onMouseEnter={() => setIsHoveringVideo(true)}
        onMouseLeave={() => setIsHoveringVideo(false)}
        className={`w-full overflow-hidden relative flex items-center justify-center select-none ${
          isFullscreen
            ? 'w-full h-full bg-black'
            : 'rounded-2xl bg-slate-950 border border-slate-800/90 aspect-video max-h-[500px] shadow-inner'
        }`}
      >
        {isVideoMode && effectiveVideoSrc ? (
          <div
            className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer group"
            onClick={handleVideoAreaClick}
          >
            <video
              ref={nativeVideoRef}
              src={effectiveVideoSrc}
              onTimeUpdate={handleNativeTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => {
                if (candidateIndex < fallbackCandidates.length - 1) {
                  setCandidateIndex((prev) => prev + 1);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                if (onLessonComplete) onLessonComplete(activeLesson.id);
              }}
              playsInline
              controls={false}
              className="w-full h-full object-contain bg-black pointer-events-none"
            />

            {/* Floating Top Mini HUD */}
            <div
              className={`absolute top-3 left-3 right-3 sm:top-5 sm:left-6 sm:right-6 flex items-center justify-between transition-opacity duration-200 z-30 ${
                isFullscreen
                  ? fsControlsVisible
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                  : isHoveringVideo || !isPlaying
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-mono font-bold border border-white/15 shadow-md">
                  {activeLesson.title}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-blue-300 text-xs font-mono font-bold border border-white/15 shadow-md">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>

              {isFullscreen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exitFullscreen();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-sans text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                  title="Exit Fullscreen (Esc or F)"
                  aria-label="Exit Fullscreen"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ─── HIGH-FIDELITY ANIMATED EDUCATIONAL ENGINE ─── */
          <div
            onClick={handleVideoAreaClick}
            className="w-full h-full relative overflow-hidden bg-radial from-slate-900 via-slate-950 to-black flex flex-col justify-between p-4 sm:p-6 text-slate-100 cursor-pointer"
          >
            {/* Background grid matrix effect */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, #2563eb 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Top Scene HUD Header */}
            <div
              className={`relative z-30 flex items-center justify-between gap-2 transition-opacity duration-200 ${
                isFullscreen
                  ? fsControlsVisible
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                  : 'opacity-100 pointer-events-auto'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  SCENE {activeScene?.id || 1}/{activeLesson.scenes.length}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    activeScene?.badgeColor || ''
                  }`}
                >
                  {activeScene?.badge}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-black/60 border border-white/10">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
                {isFullscreen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exitFullscreen();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Exit Fullscreen"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Exit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle Stage: Dynamic Visual Renderers based on Lesson & Scene */}
            <div className="relative z-10 flex-1 flex items-center justify-center py-2 min-h-0">
              {/* ─── LESSON 01 VISUALIZERS: BINARY SEARCH ─── */}
              {activeLesson.id === 1 && (
                <div className="w-full max-w-xl flex flex-col items-center justify-center animate-fadeIn px-2">
                  <div className="flex flex-col items-center gap-2 w-full">
                    {/* MID Indicator Arrow */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/50 text-blue-300 font-mono text-xs font-bold animate-pulse">
                      <span>MID POINTER</span>
                      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] text-blue-400">arr[3] = 23</span>
                    </div>

                    {/* Array Cells Row */}
                    <div className="flex border-2 border-slate-700 rounded-xl overflow-hidden bg-slate-950 shadow-2xl shadow-blue-950/50">
                      {[5, 11, 18, 23, 37, 45, 62].map((val, idx) => {
                        const isMid = idx === 3;
                        const isLast = idx === 6;
                        return (
                          <div
                            key={idx}
                            className={`w-10 sm:w-12 h-11 sm:h-12 flex flex-col items-center justify-center font-mono transition-all duration-300 ${
                              !isLast ? 'border-r border-slate-700' : ''
                            } ${
                              isMid
                                ? 'bg-blue-600 text-white font-black shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-105'
                                : 'bg-slate-900/90 text-slate-200'
                            }`}
                          >
                            <span className="text-[9px] opacity-60 font-mono">[{idx}]</span>
                            <span className="text-xs sm:text-sm font-bold">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pointers Label */}
                    <div className="flex justify-between w-full max-w-[280px] sm:max-w-[336px] text-xs font-mono font-bold text-slate-300 pt-1">
                      <span className="text-blue-400">low = 0</span>
                      <span className="text-indigo-300">mid = 3</span>
                      <span className="text-blue-400">high = 6</span>
                    </div>

                    {/* Target Found Badge & Communication Pipeline */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs font-mono font-bold">
                        Target = 23 (Mid = 23) → FOUND ✓
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                        O(log n) Logarithmic Time
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 mt-1">
                      Sorted Array → Find Middle → Compare → Narrow Search
                    </span>
                  </div>
                </div>
              )}

              {/* ─── LESSON 02 VISUALIZERS: BINARY SEARCH ALGORITHM ─── */}
              {activeLesson.id === 2 && (
                <div className="w-full max-w-xl flex flex-col items-center justify-center animate-fadeIn px-2">
                  <div className="flex flex-col items-center gap-3 w-full">
                    {/* Algorithm Step Pipeline */}
                    <div className="flex items-center justify-center gap-1.5 font-mono text-xs flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                        LOW / HIGH
                      </span>
                      <span className="text-blue-400">→</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                        FIND MID
                      </span>
                      <span className="text-blue-400">→</span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-900/80 border border-blue-600 text-blue-200 font-bold">
                        COMPARE
                      </span>
                      <span className="text-blue-400">→</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                        NARROW
                      </span>
                      <span className="text-blue-400">→</span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold">
                        REPEAT
                      </span>
                    </div>

                    {/* Decision Branching Card */}
                    <div className="w-full max-w-md p-3 rounded-xl bg-slate-900/90 border border-slate-700 font-mono text-xs text-center space-y-2">
                      <span className="text-slate-300 font-bold block">
                        COMPARE: Target &lt; arr[mid] ?
                      </span>
                      <div className="flex justify-around items-center pt-1">
                        <div className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-600/70 text-blue-300 text-xs">
                          <span className="block font-bold">YES: Search Left</span>
                          <span className="text-[10px] text-blue-400">high = mid - 1</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-600/70 text-purple-300 text-xs">
                          <span className="block font-bold">NO: Search Right</span>
                          <span className="text-[10px] text-purple-400">low = mid + 1</span>
                        </div>
                      </div>
                    </div>

                    {/* Target Found / Not Found Outcome */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold">
                        Match: Return mid
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono font-bold">
                        low &gt; high: Return -1 (Not Found)
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 text-center">
                      Binary Search works by repeatedly dividing the search space in half.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. VIDEO CONTROLS & FLOATING TOOLBAR ─── */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          setIsHoveringControls(true);
          setFsControlsVisible(true);
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
          }
        }}
        onMouseLeave={() => {
          setIsHoveringControls(false);
          resetInactivityTimer();
        }}
        onFocusCapture={() => setFsControlsVisible(true)}
        className={`w-full transition-all duration-300 ${
          isFullscreen
            ? `absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl lg:max-w-5xl z-40 p-4 sm:p-5 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-slate-700/80 shadow-[0_12px_45px_rgba(0,0,0,0.85)] text-white transition-opacity duration-200 ${
                fsControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`
            : 'w-full max-w-5xl mx-auto pt-5 mt-2 space-y-3'
        }`}
      >
        {/* TOP PROGRESS BAR (Draggable Scrubber + Circular Thumb) */}
        <div className="w-full select-none">
          <div
            ref={progressTrackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full h-6 flex items-center cursor-pointer group touch-none"
            role="slider"
            aria-label="Seek Video Timeline"
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            aria-valuenow={currentTime}
          >
            {/* Horizontal Track Background */}
            <div
              className={`w-full h-2 rounded-full transition-all relative overflow-hidden ${
                isFullscreen
                  ? 'bg-white/30 group-hover:h-2.5'
                  : 'bg-slate-300 dark:bg-slate-700 group-hover:h-2.5'
              }`}
            >
              {/* Accent Fill */}
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-[width] duration-75 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Circular Draggable Scrubber Thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 border-blue-600 dark:border-blue-400 bg-white shadow-md transition-transform duration-75 pointer-events-none ${
                isDragging ? 'scale-125 ring-4 ring-blue-500/40' : 'group-hover:scale-110'
              }`}
              style={{ left: `calc(${progressPercent}% - 9px)` }}
            />
          </div>

          {/* TIME DISPLAY (Left: Current, Right: Total) */}
          <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-semibold pt-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-lg transition-colors ${
                isFullscreen
                  ? 'text-white bg-black/60 border border-white/20 font-bold'
                  : 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 font-bold shadow-2xs'
              }`}
            >
              {formatTime(currentTime)}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-lg transition-colors ${
                isFullscreen
                  ? 'text-slate-100 bg-black/60 border border-white/20 font-bold'
                  : 'text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-bold shadow-2xs'
              }`}
            >
              {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* CONTROLS TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-1">
          {/* Left: Rewind 10s (backward only), Pause/Play */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rewind 10s */}
            <button
              onClick={() => handleSkipTime(-10)}
              className={`p-2.5 sm:p-3 rounded-2xl font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs group ${
                isFullscreen
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
              }`}
              title="Rewind 10 seconds"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-rotate-12 transition-transform" />
            </button>

            {/* Central Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 hover:from-blue-800 hover:via-blue-700 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all active:scale-95 cursor-pointer tracking-wide"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  <span>PLAY</span>
                </>
              )}
            </button>
          </div>

          {/* Middle: Playback Speed Selector (0.5x, 1x - no fast-forwarding per requirement) */}
          <div
            className={`flex items-center rounded-2xl p-1 font-mono text-xs ${
              isFullscreen
                ? 'bg-white/10 border border-white/15'
                : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {[0.5, 1].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : isFullscreen
                    ? 'text-slate-200 hover:text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
                }`}
                aria-label={`Set playback speed to ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Right: Volume Slider & Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Volume Control */}
            <div
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${
                isFullscreen
                  ? 'bg-white/10 border border-white/15 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <button
                onClick={handleToggleMute}
                className="hover:text-blue-500 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume Slider"
                className="w-16 sm:w-20 h-1.5 rounded-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-2.5 sm:p-3 rounded-2xl font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs ${
                isFullscreen
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
