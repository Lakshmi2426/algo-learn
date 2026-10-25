import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  AlertCircle,
  Video as VideoIcon,
  Tv,
  Check,
  Loader2,
  Settings,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { LessonItem, VIDEO_LESSONS } from '../data/videoLessons';
import { soundManager } from '../utils/audio';
import { progressManager } from '../utils/progressManager';
import { SLLVideoVisualizer } from './SLLVideoVisualizer';

export interface VideoTutorialsViewProps {
  video1Src?: string;
  video2Src?: string;
}

export const VideoTutorialsView: React.FC<VideoTutorialsViewProps> = ({ video1Src, video2Src }) => {
  const lessons = useMemo(() => {
    return VIDEO_LESSONS.map((lesson) => {
      if (lesson.id === 'lesson-01' && video1Src) {
        return {
          ...lesson,
          videoSrc: video1Src,
        };
      }
      if (lesson.id === 'lesson-02' && video2Src) {
        return {
          ...lesson,
          videoSrc: video2Src,
        };
      }
      return lesson;
    });
  }, [video1Src, video2Src]);

  // Default to visualizer so interactive 15-point visualization activities are immediately accessible
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(() => lessons[0] || null);
  const [activePlayerMode, setActivePlayerMode] = useState<'video' | 'visualizer'>('video');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFullscreenControlsVisible, setIsFullscreenControlsVisible] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showHudOverlay, setShowHudOverlay] = useState<boolean>(true);

  const [completedVideos, setCompletedVideos] = useState<string[]>(() => {
    return progressManager.getVideoStats().completedVideos;
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Sync completion state from progressManager
  useEffect(() => {
    const unsub = progressManager.subscribe((state) => {
      setCompletedVideos(state.completedVideos || []);
    });
    return unsub;
  }, []);

  // Close settings popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time in mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Immediate, robust video loading when selected lesson changes
  useEffect(() => {
    if (!selectedLesson) return;
    const video = videoRef.current;
    if (!video) return;

    const currentSrc = video.currentSrc || video.src || '';
    const targetSrc = selectedLesson.videoSrc || '';

    // Only update src if it is genuinely different to avoid resetting video mid-play
    if (!currentSrc.includes(targetSrc) && currentSrc !== targetSrc) {
      setHasError(false);
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      video.src = targetSrc;
      video.load();
    }
  }, [selectedLesson?.id, selectedLesson?.videoSrc]);

  // Select lesson and trigger immediate load + play directly inside the user click gesture
  const handleSelectLesson = useCallback(
    (lesson: LessonItem, autoPlay: boolean = true) => {
      soundManager.playSelect();
      setHasError(false);
      setActivePlayerMode('video');
      setSelectedLesson(lesson);
      setCurrentTime(0);

      const video = videoRef.current;
      if (video) {
        // Set the exact video source directly in the click event
        const currentSrc = video.currentSrc || video.src || '';
        const targetSrc = lesson.videoSrc;

        if (!currentSrc.includes(targetSrc) && currentSrc !== targetSrc) {
          video.src = targetSrc;
          video.currentTime = 0;
          video.load();
        }

        video.playbackRate = playbackSpeed;
        video.volume = isMuted ? 0 : volume;
        video.muted = isMuted;

        if (autoPlay) {
          soundManager.playVideoPlay();
          setIsPlaying(true);
          setIsLoading(true);

          // Synchronous play call within click gesture preserves browser user-activation
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
                setHasError(false);
              })
              .catch((err) => {
                console.warn('Playback pending buffer, waiting for canplay:', err);
                const onCanPlay = () => {
                  video
                    .play()
                    .then(() => {
                      setIsPlaying(true);
                      setIsLoading(false);
                      setHasError(false);
                    })
                    .catch((err2) => {
                      console.warn('Autoplay unmuted blocked by policy, falling back to muted play:', err2);
                      video.muted = true;
                      setIsMuted(true);
                      video
                        .play()
                        .then(() => {
                          setIsPlaying(true);
                          setIsLoading(false);
                        })
                        .catch(() => {
                          setIsPlaying(false);
                          setIsLoading(false);
                        });
                    });
                  video.removeEventListener('canplay', onCanPlay);
                };
                video.addEventListener('canplay', onCanPlay, { once: true });
              });
          }
        } else {
          setIsPlaying(false);
        }
      }

      // Smooth scroll down to video player
      if (playerContainerRef.current) {
        playerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [playbackSpeed, volume, isMuted]
  );

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current || !selectedLesson) return;

    if (isPlaying) {
      soundManager.playVideoPause();
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      soundManager.playVideoPlay();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    }
  }, [isPlaying, selectedLesson]);

  // Strict Pause (for 'K' keyboard shortcut)
  const pauseVideoStrict = useCallback(() => {
    if (!videoRef.current || !selectedLesson) return;
    if (isPlaying) {
      soundManager.playVideoPause();
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying, selectedLesson]);

  // Rewind 10s
  const handleRewind = useCallback(() => {
    if (!videoRef.current) return;
    soundManager.playVideoSeek();
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Forward 10s
  const handleForward = useCallback(() => {
    if (!videoRef.current) return;
    soundManager.playVideoSeek();
    const maxTime = duration || videoRef.current.duration || 0;
    const newTime = Math.min(maxTime, videoRef.current.currentTime + 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Timeline scrubber seek - prevent seeking forward (only backward navigation allowed)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const curr = videoRef.current ? videoRef.current.currentTime : currentTime;
    if (time > curr + 0.5) {
      // Prevent seeking forward
      return;
    }
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Speed selector - capped at 1x to prevent fast-forwarding
  const handleChangeSpeed = useCallback((spd: number) => {
    if (spd > 1) return; // Prevent fast-forwarding
    soundManager.playVideoSpeed();
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
  }, []);

  // Volume slider
  const handleVolumeChange = (newVol: number) => {
    soundManager.playVideoSeek();
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = muted;
    }
  };

  // Mute / Unmute toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    soundManager.playVideoSeek();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  }, [isMuted]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    const isDocFs = !!document.fullscreenElement;
    soundManager.playVideoFullscreen(!isDocFs);

    if (!isDocFs) {
      playerContainerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          setIsFullscreenControlsVisible(true);
        })
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          setIsFullscreenControlsVisible(true);
        })
        .catch(() => {});
    }
  }, []);

  // Retry loading current video
  const handleRetry = () => {
    if (!selectedLesson || !videoRef.current) return;
    soundManager.playClick();
    setHasError(false);
    setIsLoading(true);
    videoRef.current.src = selectedLesson.videoSrc;
    videoRef.current.load();
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  };

  // HTML5 Video Lifecycle Handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsLoading(false);
      setHasError(false);
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;

      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch(() => {
              setIsPlaying(false);
              setIsLoading(false);
            });
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (selectedLesson) {
      soundManager.playVideoComplete();
      progressManager.completeVideo(selectedLesson.id);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    setHasError(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  // Activity trigger for auto-hiding fullscreen controls
  const triggerFullscreenActivity = useCallback(() => {
    if (!isFullscreen) return;
    setIsFullscreenControlsVisible(true);

    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }

    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setIsFullscreenControlsVisible(false);
      }, 3000);
    }
  }, [isFullscreen, isPlaying]);

  const handleControlsInteraction = () => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    setIsFullscreenControlsVisible(true);
  };

  useEffect(() => {
    if (isFullscreen && isPlaying) {
      triggerFullscreenActivity();
    } else if (!isPlaying) {
      setIsFullscreenControlsVisible(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    }
  }, [isFullscreen, isPlaying, triggerFullscreenActivity]);

  // Keyboard Shortcuts Listener (Space, J, K, L, F, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handleRewind();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        pauseVideoStrict();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, handleRewind, pauseVideoStrict, toggleFullscreen]);

  // Sync document fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      const isDocFs = !!document.fullscreenElement;
      setIsFullscreen(isDocFs);
      setIsFullscreenControlsVisible(true);
      if (!isDocFs && hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* =========================================================================
          PART 1 — TWO LESSON CARDS (SIDE BY SIDE ON DESKTOP, STACKED ON MOBILE)
          ========================================================================= */}
      <section aria-label="Video Lessons Selection">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((lesson) => {
            const isSelected = selectedLesson?.id === lesson.id;
            const isCompleted = completedVideos.includes(lesson.id);

            return (
              <div
                key={lesson.id}
                id={`video-card-${lesson.id}`}
                onClick={() => handleSelectLesson(lesson, true)}
                className={`p-6 sm:p-7 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-white dark:bg-[#0B1228] border-[#2563EB] dark:border-blue-500 shadow-md dark:shadow-[0_0_24px_rgba(37,99,235,0.25)] ring-2 ring-[#2563EB]/20 dark:ring-blue-500/30'
                    : 'bg-white dark:bg-[#0B1228]/85 border-[#E2E8F0] dark:border-blue-900/30 hover:border-[#BFDBFE] dark:hover:border-blue-500/50 shadow-xs'
                }`}
              >
                <div>
                  {/* Lesson Header Pill & Completion Indicator */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-bold font-mono border tracking-wide transition-colors ${
                          isSelected
                            ? 'bg-[#EFF6FF] dark:bg-blue-950/80 text-[#2563EB] dark:text-blue-300 border-[#BFDBFE] dark:border-blue-500/40'
                            : 'bg-[#F8FAFC] dark:bg-blue-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/30'
                        }`}
                      >
                        {lesson.lessonNumber}
                      </span>

                      {/* Prominent +5 pts reward badge */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-2xs">
                        +5 pts
                      </span>

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>COMPLETED</span>
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] dark:bg-blue-600 text-white shadow-xs'
                          : 'bg-[#EFF6FF] dark:bg-blue-950/30 text-[#2563EB] dark:text-blue-400'
                      }`}
                    >
                      <VideoIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl sm:text-2xl font-extrabold font-sans text-slate-900 dark:text-white tracking-tight leading-snug mb-2.5 break-words">
                    {lesson.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 font-normal break-words">
                    {lesson.description}
                  </p>

                  {/* Topic Labels */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {lesson.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#F1F5F9] dark:bg-[#070B18] text-[#334155] dark:text-slate-200 border border-slate-200/90 dark:border-blue-900/30 tracking-normal"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Primary Button: CLICK TO WATCH */}
                <button
                  id={`btn-watch-${lesson.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLesson(lesson, true);
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#2563EB] dark:bg-blue-600 hover:bg-[#1D4ED8] dark:hover:bg-blue-500 text-white shadow-md'
                      : 'bg-[#EFF6FF] dark:bg-blue-950/50 hover:bg-[#DBEAFE] dark:hover:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-900/40'
                  }`}
                  aria-label={`Click to watch ${lesson.title}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>CLICK TO WATCH</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          PART 2 — VIDEO PLAYER AREA WITH ALGOLEARN BRANDED HUD OVERLAY & WATERMARK
          ========================================================================= */}
      <section
        aria-label="Video Player Area"
        className="p-4 sm:p-8 rounded-2xl bg-white dark:bg-[#0B1228]/90 border border-slate-200 dark:border-blue-900/30 shadow-[0_4px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_0_32px_rgba(37,99,235,0.12)] space-y-4 sm:space-y-6"
      >
        {/* Header Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-blue-900/25">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border border-[#DBEAFE] dark:border-blue-900/40 shrink-0 shadow-xs">
              <Tv className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Current Lesson
                </span>
                {selectedLesson && isPlaying && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400 animate-pulse" />
                    NOW PLAYING
                  </span>
                )}
              </div>
              <h3
                id="current-lesson-title"
                className="text-base sm:text-xl font-bold font-sans text-slate-900 dark:text-white break-words leading-snug"
              >
                {selectedLesson ? selectedLesson.title : 'Select a lesson to begin'}
              </h3>
            </div>
          </div>

          {/* Mode Switcher Buttons: Video Stream vs Concept Visualizer */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="p-1 bg-slate-100 dark:bg-[#070B18] border border-slate-200 dark:border-blue-900/40 rounded-xl flex items-center gap-1">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePlayerMode('video');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePlayerMode === 'video'
                    ? 'bg-[#2563EB] dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>VIDEO LESSON</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActivePlayerMode('visualizer');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePlayerMode === 'visualizer'
                    ? 'bg-[#2563EB] dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>CONCEPT VISUALIZER</span>
              </button>
            </div>

            {selectedLesson && (
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-[#070B18] border border-slate-200 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg font-mono hidden md:inline-block">
                {selectedLesson.filename}
              </span>
            )}
          </div>
        </div>

        {/* Video Player Display Container with Futuristic Dark Navy Styling */}
        <div
          ref={playerContainerRef}
          onMouseMove={triggerFullscreenActivity}
          onPointerMove={triggerFullscreenActivity}
          onTouchStart={triggerFullscreenActivity}
          onClick={triggerFullscreenActivity}
          className={`relative w-full bg-[#050A1A] rounded-2xl overflow-hidden border border-slate-800/90 dark:border-blue-900/50 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_28px_rgba(37,99,235,0.12)] flex items-center justify-center group select-none ${
            isFullscreen
              ? `fixed inset-0 z-50 rounded-none w-screen h-screen ${
                  !isFullscreenControlsVisible ? 'cursor-none' : 'cursor-default'
                }`
              : 'aspect-video'
          }`}
        >
          {/* Subtle Grid & Glow Background on Container */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* =========================================================================
              ALGOLEARN BRANDED HUD OVERLAY (TOP-LEFT, TOP-CENTER, TOP-RIGHT COVER)
              ========================================================================= */}
          {selectedLesson && (
            <div
              className={`absolute top-0 left-0 right-0 p-3 sm:p-5 z-25 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between gap-3 pointer-events-none transition-opacity duration-300 ${
                isFullscreen && !isFullscreenControlsVisible ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {/* TOP-LEFT: Lesson Badge & Time Badge */}
              <div
                className={`flex items-center gap-2 pointer-events-auto transition-opacity duration-200 ${
                  showHudOverlay ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold font-mono tracking-wider bg-blue-600/90 text-white shadow-sm border border-blue-400/40">
                  {selectedLesson.lessonNumber}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono font-semibold bg-slate-900/80 text-blue-300 border border-blue-500/30 backdrop-blur-xs flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{selectedLesson.id === 'lesson-01' ? '08:45' : '12:30'}</span>
                </span>
              </div>

              {/* TOP-CENTER: Video Title (SINGLY LINKED LIST / INTRODUCTION or OPERATIONS) */}
              <div
                className={`flex flex-col items-center text-center select-none pointer-events-auto min-w-0 transition-opacity duration-200 ${
                  showHudOverlay ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="text-[9px] sm:text-[11px] tracking-[0.25em] font-mono uppercase text-blue-300/90 font-bold">
                  SINGLY LINKED LIST
                </span>
                <span className="text-xs sm:text-sm md:text-base font-extrabold font-sans uppercase tracking-wider text-white drop-shadow-[0_2px_10px_rgba(37,99,235,0.8)]">
                  {selectedLesson.id === 'lesson-02' ? 'OPERATIONS' : 'INTRODUCTION'}
                </span>
              </div>

              {/* TOP-RIGHT: Solid Cover Container Completely Hiding Original Gemini Watermark */}
              <div
                id="algolearn-top-brand-cover"
                className="pointer-events-auto rounded-xl px-3.5 sm:px-5 py-1.5 sm:py-2.5 flex items-center justify-center border border-blue-900/60 shadow-[0_4px_28px_rgba(0,0,0,0.95),0_0_16px_rgba(5,10,26,1)] shrink-0"
                style={{
                  backgroundColor: '#050A1A',
                  minWidth: '175px',
                  height: '46px',
                  opacity: 1,
                }}
              >
                <img
                  src="/algolearn-logo-dark.png"
                  alt="AlgoLearn"
                  className="h-5 sm:h-7 w-auto object-contain select-none pointer-events-none drop-shadow"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              ALGOLEARN WATERMARK (BOTTOM-RIGHT CORNER - SOLID COVER CONTAINER)
              Completely Hiding any Gemini Logo/Star/Text at Bottom-Right
              ========================================================================= */}
          {selectedLesson && (
            <div
              id="algolearn-bottom-brand-cover"
              className={`absolute bottom-20 sm:bottom-24 right-3 sm:right-6 pointer-events-none select-none z-20 transition-all duration-300 ${
                isFullscreen && !isFullscreenControlsVisible ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div
                className="rounded-xl px-3.5 sm:px-5 py-1.5 sm:py-2 flex items-center justify-center border border-blue-900/60 shadow-[0_4px_28px_rgba(0,0,0,0.95),0_0_16px_rgba(5,10,26,1)]"
                style={{
                  backgroundColor: '#050A1A',
                  minWidth: '165px',
                  height: '44px',
                  opacity: 1,
                }}
              >
                <img
                  src="/algolearn-logo-dark.png"
                  alt="AlgoLearn Watermark"
                  className="h-4.5 sm:h-5.5 w-auto object-contain select-none pointer-events-none drop-shadow"
                />
              </div>
            </div>
          )}

          {/* Case 1: No lesson selected yet */}
          {!selectedLesson && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-[#070B18] text-slate-300 space-y-3.5 select-none">
              <div className="w-16 h-16 rounded-2xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
                <VideoIcon className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white font-sans">
                Select a lesson and click CLICK TO WATCH.
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md font-sans leading-relaxed">
                Choose between Introduction to Singly Linked List or Singly Linked List Operations to load and play the video tutorial.
              </p>
            </div>
          )}

          {/* Case 2: Error State */}
          {selectedLesson && hasError && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-[#070B18] text-slate-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-sans">
                  VIDEO COULD NOT BE LOADED
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                  Please check the video file: <code className="text-rose-300 font-mono">{selectedLesson.filename}</code>
                </p>
              </div>
              <button
                id="btn-video-try-again"
                onClick={handleRetry}
                className="px-5 py-2.5 bg-[#2563EB] dark:bg-blue-600 hover:bg-[#1D4ED8] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>TRY AGAIN</span>
              </button>
            </div>
          )}

          {/* Case 3: Concept Visualizer Stage (When toggled to Visualizer mode) */}
          {activePlayerMode === 'visualizer' && selectedLesson && (
            <div className="w-full h-full p-2 sm:p-4 overflow-y-auto z-15 bg-[#050A1A]">
              <SLLVideoVisualizer lessonId={selectedLesson.id} />
            </div>
          )}

          {/* Case 4: Real HTML5 Video Element (object-contain ensures NO distortion or stretching) */}
          <video
            ref={videoRef}
            preload="metadata"
            playsInline
            className={`w-full h-full object-contain ${
              selectedLesson && !hasError && activePlayerMode === 'video' ? 'block' : 'hidden'
            }`}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onClick={togglePlay}
          />

          {/* Loading Spinner */}
          {selectedLesson && isLoading && !hasError && activePlayerMode === 'video' && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center gap-3 pointer-events-none text-white z-20">
              <Loader2 className="w-9 h-9 text-blue-400 animate-spin" />
              <span className="text-xs font-bold font-mono tracking-wider uppercase">
                LOADING VIDEO...
              </span>
            </div>
          )}

          {/* Fullscreen Overlay Controls */}
          {isFullscreen && selectedLesson && (
            <div
              onMouseEnter={handleControlsInteraction}
              onTouchStart={handleControlsInteraction}
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-50 bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-3 transition-all duration-300 ease-out ${
                isFullscreenControlsVisible
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              {/* Progress Scrubber */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                  aria-label="Seek video progress"
                />
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold px-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRewind}
                    className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Rewind 10s (J)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                    title={isPlaying ? 'Pause (Space/K)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    <span className="uppercase font-bold">{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />

                  <button
                    onClick={toggleFullscreen}
                    className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer transition-colors active:scale-95 flex items-center justify-center"
                    title="Exit Fullscreen (F / ESC)"
                  >
                    <Minimize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CLEAN VIDEO CONTROL BAR
            - Play / Pause
            - Current time
            - Total duration
            - Progress bar
            - Volume
            - Settings
            - Fullscreen
            ========================================================================= */}
        {selectedLesson && !isFullscreen && (
          <div
            id="video-controls-container"
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070E24] border border-slate-200/90 dark:border-blue-900/40 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] space-y-3.5"
          >
            {/* Progress Bar & Timeline Scrubber */}
            <div className="space-y-1.5">
              <div className="relative flex items-center group/scrub">
                <input
                  id="video-timeline-scrubber"
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={hasError || duration === 0}
                  className="w-full h-2.5 bg-slate-100 dark:bg-blue-950/80 rounded-full appearance-none cursor-pointer accent-[#2563EB] dark:accent-blue-500 focus:outline-none transition-all disabled:opacity-50"
                  aria-label="Seek video progress"
                />
              </div>
            </div>

            {/* Controls Bar: Left (Play/Pause, Timestamps) | Right (Volume, Settings, Fullscreen) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {/* LEFT SIDE: Rewind + Play/Pause + Forward + Time Display */}
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                <button
                  id="btn-video-rewind"
                  onClick={handleRewind}
                  disabled={hasError}
                  className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#091433] dark:hover:bg-blue-950/60 border border-slate-200/90 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                  title="Rewind 10s (J)"
                  aria-label="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  id="btn-video-play-pause"
                  onClick={togglePlay}
                  disabled={hasError}
                  className="h-10 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  title={isPlaying ? 'Pause video (Space/K)' : 'Play video (Space)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span className="tracking-wide uppercase font-bold text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                {/* Current Time / Total Duration */}
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-600 dark:text-blue-300/90 pl-1.5">
                  <span id="video-current-time">{formatTime(currentTime)}</span>
                  <span className="text-slate-400 dark:text-blue-500/50">/</span>
                  <span id="video-total-duration">{formatTime(duration)}</span>
                </div>
              </div>

              {/* RIGHT SIDE: Volume + Settings + Fullscreen */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 border-t sm:border-t-0 border-slate-100 dark:border-blue-900/25 pt-2 sm:pt-0">
                {/* Volume Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="btn-video-mute"
                    onClick={toggleMute}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-blue-950/40 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                    )}
                  </button>

                  <input
                    id="video-volume-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2563EB] dark:accent-blue-500"
                    aria-label="Volume slider"
                  />
                </div>

                {/* Settings Popover Button & Menu */}
                <div ref={settingsRef} className="relative shrink-0">
                  <button
                    id="btn-video-settings"
                    onClick={() => setIsSettingsOpen((prev) => !prev)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isSettingsOpen
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-[#2563EB] dark:text-blue-300'
                        : 'hover:bg-slate-100 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300'
                    }`}
                    title="Playback Settings"
                    aria-label="Settings"
                  >
                    <Settings className="w-4.5 h-4.5" />
                  </button>

                  {isSettingsOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl bg-white dark:bg-[#091433] border border-slate-200 dark:border-blue-800/60 shadow-2xl p-3 z-50 text-xs space-y-3 animate-fadeIn">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 dark:text-blue-300/70 block mb-1.5">
                          Playback Speed
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[0.5, 0.75, 1].map((spd) => (
                            <button
                              key={spd}
                              onClick={() => {
                                handleChangeSpeed(spd);
                                setIsSettingsOpen(false);
                              }}
                              className={`py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                                playbackSpeed === spd
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-blue-900/50'
                              }`}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-blue-900/40 space-y-1.5">
                        <button
                          onClick={() => setShowHudOverlay((prev) => !prev)}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                        >
                          <span>Branded HUD Overlay</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              showHudOverlay
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {showHudOverlay ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  id="btn-video-fullscreen"
                  onClick={toggleFullscreen}
                  className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#091433] dark:hover:bg-blue-950/60 border border-slate-200/90 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center shrink-0"
                  title={isFullscreen ? 'Exit Fullscreen (F / ESC)' : 'Enter Fullscreen (F)'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          PART 3 — INTERACTIVE EDUCATIONAL VISUALIZER COMPONENT (BELOW PLAYER)
          Focused on:
          - Video 1: 8 Core Fundamentals & Animated HEAD ↓ [ 10 | NEXT ] → [ 20 | NEXT ] → [ 30 | NEXT ] → NULL
          - Video 2: 9 Operations (Traversal, Insertion at Pos, Deletion, Searching, Rewiring)
          ========================================================================= */}
      {selectedLesson && (
        <section aria-label="Interactive Singly Linked List Visualizer" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/10 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-white">
                  {selectedLesson.id === 'lesson-01'
                    ? 'Interactive Fundamentals & Node Architecture'
                    : 'Interactive Operation Stepper & Pointer Rewiring'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedLesson.id === 'lesson-01'
                    ? 'Explore node structure, data payload, pointer addresses, and heap allocation.'
                    : 'Step through sequential traversal, node insertion, deletion bypass, and linear searching.'}
                </p>
              </div>
            </div>
          </div>

          <SLLVideoVisualizer lessonId={selectedLesson.id} />
        </section>
      )}
    </div>
  );
};
