import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getActiveUserId, removeUserItem } from '../../utils/userStorage';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Video as VideoIcon,
  CheckCircle2,
  Scan,
  Menu,
  Rewind,
  Sparkles,
  Clock,
  X,
  ChevronLeft
} from 'lucide-react';

interface VisualizeViewProps {
  isDarkMode: boolean;
  userId?: string;
  videoUrl?: string | null;
  isVideoCompleted?: boolean;
  onToggleVideoCompleted?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const PUBLIC_LESSON_VIDEO_URL = '/videos/lesson.mp4';

// Exactly 9 Trees subtopics specified in the requirements
const TREES_SUBTOPICS = [
  'Introduction to Trees',
  'Tree Terminology',
  'Types of Trees',
  'Binary Trees',
  'Binary Search Trees (BST)',
  'Tree Traversals',
  'Tree Insertion',
  'Tree Deletion',
  'Applications of Trees',
];

export const VisualizeView: React.FC<VisualizeViewProps> = ({
  isDarkMode,
  userId,
  videoUrl = PUBLIC_LESSON_VIDEO_URL,
  isVideoCompleted = false,
  onToggleVideoCompleted,
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const effectiveUserId = userId || getActiveUserId();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoLoadError, setVideoError] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [completionBannerShown, setCompletionBannerShown] = useState<boolean>(false);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear legacy saved playback time so video always starts cleanly
  useEffect(() => {
    try {
      removeUserItem(effectiveUserId, 'video_last_time');
    } catch {}
  }, [effectiveUserId]);

  // Synchronize fullscreen events from browser and native video players
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isDocFull);
      if (!isDocFull) {
        document.body.style.overflow = isVideoModalOpen ? 'hidden' : '';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isVideoModalOpen]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const candidateUrls = useMemo(() => [
    videoUrl || PUBLIC_LESSON_VIDEO_URL,
    '/videos/lesson.mp4',
    '/dsa-modules/trees/videos/lesson.mp4',
    './videos/lesson.mp4',
  ], [videoUrl]);

  const [currentUrlIndex, setCurrentUrlIndex] = useState<number>(0);
  const activeVideoUrl = candidateUrls[Math.min(currentUrlIndex, candidateUrls.length - 1)];

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setVideoError(false);
          })
          .catch((err) => {
            console.warn('Autoplay unmuted blocked, falling back to muted play:', err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setVideoError(false);
                })
                .catch(() => {
                  setIsPlaying(false);
                });
            } else {
              setIsPlaying(false);
            }
          });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Seek handler - backward navigation only (prevents skipping forward)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (newTime <= currentTime) {
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    }
  };

  // Skip backward only (-5s)
  const skip = (seconds: number) => {
    if (!videoRef.current || seconds >= 0) return;
    const target = Math.max(0, videoRef.current.currentTime + seconds);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  // Volume slider handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume > 0 ? volume : 0.5;
      if (volume === 0) setVolume(0.5);
    }
  };

  // Playback speed cycle
  const cyclePlaybackSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  // Toggle fit mode between 100% cover and contain
  const toggleFitMode = () => {
    setFitMode((prev) => (prev === 'cover' ? 'contain' : 'cover'));
  };

  // Cross-browser Fullscreen toggle
  const toggleFullscreen = () => {
    const elem = playerContainerRef.current as any;
    const vid = videoRef.current as any;

    if (!isFullscreen) {
      setIsFullscreen(true);
      if (elem) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {
            if (vid?.requestFullscreen) vid.requestFullscreen().catch(() => {});
          });
          return;
        } else if (elem.webkitRequestFullscreen) {
          try {
            elem.webkitRequestFullscreen();
            return;
          } catch {}
        }
      }
      if (vid?.requestFullscreen) {
        vid.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    }
  };

  // Mouse activity for hiding controls when playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      skip(-5);
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'Escape') {
      if (isFullscreen) {
        e.preventDefault();
        toggleFullscreen();
      } else if (isVideoModalOpen) {
        e.preventDefault();
        handleCloseVideoModal();
      }
    }
  };

  // Open modal and play video
  const handleOpenVideoModal = () => {
    setIsVideoModalOpen(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setVideoError(false);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        }
      }
    }, 150);
  };

  // Close modal and pause video
  const handleCloseVideoModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setIsVideoModalOpen(false);
    document.body.style.overflow = '';
  };

  // Award 30 points upon complete video playback (awarded strictly once)
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (!isVideoCompleted && onToggleVideoCompleted) {
      onToggleVideoCompleted();
      setCompletionBannerShown(true);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* 1. VISUALIZE PAGE HEADING & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          {!isSidebarOpen && onToggleSidebar && (
            <button
              id="visualize-sidebar-toggle-btn"
              onClick={onToggleSidebar}
              title="Open Navigation Menu"
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isDarkMode
                  ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-black'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              isDarkMode
                ? 'bg-blue-950/60 border-blue-800/40 text-blue-400'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight uppercase ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              VISUALIZE
            </h1>
            <p
              className={`text-xs sm:text-sm mt-0.5 font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Watch the Trees lesson video completely to master tree concepts.
            </p>
          </div>
        </div>

        {/* Topic points summary badge in AlgoLearn blue theme */}
        <div className="shrink-0 self-start sm:self-center">
          <span
            id="visualize-topic-points-indicator"
            className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-xs ${
              isDarkMode
                ? 'bg-blue-950/60 border-blue-800/60 text-blue-300'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
            title="Visualize Topic Points"
          >
            <span className={isDarkMode ? 'text-blue-300' : 'text-blue-800'}>Topic Points:</span>
            <span className={isDarkMode ? 'text-blue-400 font-extrabold' : 'text-blue-600 font-extrabold'}>
              {isVideoCompleted ? '30 / 30 pts' : '0 / 30 pts'}
            </span>
          </span>
        </div>
      </div>

      {/* 2. SINGLE VIDEO CARD (EXACTLY ONE VIDEO CARD FOR THIS TOPIC) */}
      <div
        id="visualize-single-video-card"
        className={`p-6 sm:p-8 rounded-3xl border transition-all duration-200 shadow-xl ${
          isDarkMode
            ? 'bg-[#0a1020] border-blue-900/40 text-slate-100 shadow-blue-950/20'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-slate-200/70'
        }`}
      >
        {/* Card Header Row: Topic, Lesson 01 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span
              className={`text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider px-3 py-1 rounded-full border ${
                isDarkMode
                  ? 'bg-blue-950/60 border-blue-800/50 text-blue-300'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              TREES — NON-LINEAR DATA STRUCTURE
            </span>

            <span
              className={`text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isDarkMode
                  ? 'bg-zinc-900 border-zinc-800 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              LESSON 01
            </span>
          </div>
        </div>

        {/* Title and Short Description */}
        <div className="space-y-2 mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Trees — Non-Linear Data Structure
          </h2>
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            A complete comprehensive visual guide to hierarchical non-linear tree data structures, node properties, binary trees, binary search trees (BST), and algorithmic operations.
          </p>
        </div>

        {/* Status Row */}
        <div
          className={`p-4 rounded-2xl border mb-6 flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode
              ? 'bg-[#080d1a] border-blue-950/70'
              : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          {/* Status */}
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold ${isDarkMode ? 'opacity-75' : 'text-slate-700'}`}>Status:</span>
            {isVideoCompleted ? (
              <span
                id="visualize-status-badge"
                className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-full border ${
                  isDarkMode
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                Completed
              </span>
            ) : (
              <span
                id="visualize-status-badge"
                className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-full border ${
                  isDarkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                Incomplete
              </span>
            )}
          </div>

          {/* Visualizations count (0/23 not in percentage) */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isDarkMode ? 'opacity-75' : 'text-slate-700'}`}>Visualizations:</span>
            <span
              id="visualize-count-indicator"
              className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-3 py-1 rounded-full border ${
                isDarkMode
                  ? 'bg-blue-950/60 border-blue-800/60 text-blue-300 font-extrabold'
                  : 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold'
              }`}
            >
              {isVideoCompleted ? '1 / 1' : '0 / 1'}
            </span>
          </div>
        </div>

        {/* Subtopics Section: 9 small, neat labels neatly arranged below description */}
        <div className="mb-6 space-y-2.5">
          <div className={`text-[11px] font-bold tracking-wider uppercase ${isDarkMode ? 'opacity-75' : 'text-slate-700'}`}>
            SUBTOPICS COVERED:
          </div>
          <div className="flex flex-wrap gap-2">
            {TREES_SUBTOPICS.map((subtopic) => (
              <span
                key={subtopic}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                  isDarkMode
                    ? 'bg-[#0e1526] border-blue-950/80 text-slate-300 hover:border-blue-600/60'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                {subtopic}
              </span>
            ))}
          </div>
        </div>

        {/* Video Card Preview & Prominent Action Button */}
        <div className="space-y-4 pt-2">
          {/* Video Preview Canvas with Play Button */}
          <div
            onClick={handleOpenVideoModal}
            className="relative w-full aspect-video sm:aspect-[21/9] max-h-72 rounded-2xl overflow-hidden border border-blue-950/50 bg-black cursor-pointer group shadow-inner"
          >
            <img
              src="/videos/poster.jpg"
              alt="Tree DSA Masterclass Preview"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-102 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl drop-shadow-lg transition-transform group-hover:scale-110">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>

            {/* Video overlay badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white drop-shadow-md">
              <span className="font-semibold px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs">
                Tree DSA Complete Visual Lesson
              </span>
            </div>
          </div>

          {/* Prominent Blue Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <button
              id="btn-watch-trees-video"
              onClick={handleOpenVideoModal}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>WATCH TREES VIDEO</span>
            </button>

            {isVideoCompleted && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Lesson completed.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. VIDEO PLAYER MODAL / PLAYBACK EXPERIENCE */}
      {isVideoModalOpen && (
        <div
          tabIndex={0}
          ref={playerContainerRef}
          onKeyDown={handleKeyDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none outline-none overflow-hidden"
        >
          {/* Top Bar inside Modal */}
          <div
            className={`relative z-40 px-4 sm:px-8 py-3.5 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex items-center justify-between gap-3 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Back to Visualize Button */}
            <button
              id="btn-close-video-modal"
              onClick={handleCloseVideoModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/85 text-slate-200 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer text-xs font-semibold shrink-0"
              title="Return to Visualize Page (Esc)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Visualize</span>
            </button>

            {/* Title & Lesson tag */}
            <div className="min-w-0 text-center hidden md:block">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                TREES — NON-LINEAR DATA STRUCTURE · LESSON 01
              </div>
              <h2 className="text-sm font-extrabold text-white truncate">
                Tree DSA Complete Visual Lesson
              </h2>
            </div>

            {/* Status / Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              {isVideoCompleted && (
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-md bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Completed</span>
                </div>
              )}

              <button
                onClick={handleCloseVideoModal}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/85 text-slate-300 hover:text-white border border-white/20 transition-all cursor-pointer"
                title="Close Video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Video Viewport */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={activeVideoUrl}
              poster="/videos/poster.jpg"
              controls={false}
              playsInline
              preload="metadata"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
              onEnded={handleVideoEnded}
              onError={() => {
                if (currentUrlIndex < candidateUrls.length - 1) {
                  setCurrentUrlIndex((prev) => prev + 1);
                } else {
                  setVideoError(true);
                  setIsPlaying(false);
                }
              }}
              className={`max-w-full max-h-full transition-all duration-300 ${
                fitMode === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
              } cursor-pointer`}
            >
              <source src={activeVideoUrl} type="video/mp4" />
              <source src="/videos/lesson.mp4" type="video/mp4" />
              <source src="/dsa-modules/trees/videos/lesson.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play/Pause Overlay indicator when paused */}
            {!isPlaying && !videoLoadError && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl drop-shadow-xl transform hover:scale-105 transition-transform">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Completion Banner */}
            {completionBannerShown && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>🎉 Lesson Completed!</span>
              </div>
            )}
          </div>

          {/* Bottom Custom Playback Controls Bar */}
          <div
            className={`relative z-40 px-4 sm:px-8 py-3.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Progress Scrub Bar (Backward seeking only; forward seek prohibited) */}
            <div className="relative flex items-center gap-3 mb-2.5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 rounded-full appearance-none bg-slate-700/80 cursor-pointer accent-blue-500 hover:h-2.5 transition-all"
                title="Scrub backward (forward seeking prohibited)"
              />
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between gap-3 text-white text-xs font-semibold">
              <div className="flex items-center gap-3">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                {/* Rewind 5s Button */}
                <button
                  onClick={() => skip(-5)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1"
                  title="Rewind 5 seconds"
                >
                  <Rewind className="w-3.5 h-3.5" />
                  <span>5s</span>
                </button>

                {/* Time Display */}
                <div className="font-mono text-slate-300">
                  <span>{formatTime(currentTime)}</span>
                  <span className="opacity-50 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2.5">
                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1.5 rounded-full appearance-none bg-slate-700 cursor-pointer accent-blue-500 hidden sm:block"
                  />
                </div>

                {/* Playback Speed */}
                <button
                  onClick={cyclePlaybackSpeed}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-mono transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {/* Fit Mode Toggle */}
                <button
                  onClick={toggleFitMode}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer hidden md:block"
                  title={fitMode === 'cover' ? 'Fit frame (Contain)' : 'Fill screen (Cover)'}
                >
                  <Scan className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
