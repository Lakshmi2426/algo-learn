import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Film,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Layers,
  MonitorPlay,
  Video,
} from 'lucide-react';
import { LessonData, EducationalScene } from '../../data/labVideoData';
import { Lesson1AnimatedStage } from './Lesson1AnimatedStage';
import { Lesson2AnimatedStage } from './Lesson2AnimatedStage';
import { soundEffects } from '../../services/sound';

export type { LessonData, EducationalScene };

interface EducationalVideoPlayerProps {
  activeLesson: LessonData;
  customVideoUrl: string | null;
  customVideoName: string | null;
  autoPlayTrigger?: number;
  onSelectLesson?: (lessonId: number) => void;
  onUploadClick: () => void;
  onLessonComplete?: (lessonId: number) => void;
}

export const EducationalVideoPlayer: React.FC<EducationalVideoPlayerProps> = ({
  activeLesson,
  customVideoUrl,
  customVideoName,
  autoPlayTrigger,
  onLessonComplete,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(activeLesson.duration || 57);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [renderMode, setRenderMode] = useState<'studio' | 'video'>('video');
  const [forwardBlockedNotice, setForwardBlockedNotice] = useState<boolean>(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Highest timestamp reached in the current session (forward seeking beyond this is strictly disabled)
  const maxReachedTimeRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevVolumeRef = useRef<number>(1);
  const animationFrameRef = useRef<number | null>(null);
  const watchedSecondsSetRef = useRef<Set<number>>(new Set());

  // Time formatter helper: converts seconds to MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${padMins}:${padSecs}`;
  };

  // Dedicated real studio audio source
  const audioSourceUrl = activeLesson.audioSrc || `/Videos/lesson${activeLesson.id}-audio.mp3`;

  // Video source URLs (for fallback or uploaded custom video)
  const videoSourceUrl = customVideoUrl || activeLesson.videoSrc || `/Videos/${activeLesson.filename}`;
  const publicVideoUrl = `/Videos/${activeLesson.filename}`;
  const encodedPublicVideoUrl = `/Videos/${encodeURIComponent(activeLesson.filename)}`;

  // Determine current active scene based on single authoritative currentTime
  const currentSceneIndex = Math.min(
    activeLesson.scenes.length - 1,
    Math.max(
      0,
      activeLesson.scenes.findIndex(
        (scene) => currentTime >= scene.timeStart && currentTime < scene.timeEnd
      )
    )
  );
  const activeSceneIndexSafe = currentSceneIndex === -1 ? activeLesson.scenes.length - 1 : currentSceneIndex;
  const currentScene: EducationalScene = activeLesson.scenes[activeSceneIndexSafe] || activeLesson.scenes[0];

  // Stop any audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
  }, []);

  // Synchronize when activeLesson changes
  useEffect(() => {
    stopAudio();
    setCurrentTime(0);
    maxReachedTimeRef.current = 0;
    setIsPlaying(false);
    setDuration(activeLesson.duration || 57);
    watchedSecondsSetRef.current = new Set();
    setRenderMode('video');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
      try {
        audioRef.current.load();
      } catch {}
    }

    if (nativeVideoRef.current) {
      nativeVideoRef.current.pause();
      nativeVideoRef.current.currentTime = 0;
      nativeVideoRef.current.playbackRate = playbackSpeed;
      nativeVideoRef.current.volume = isMuted ? 0 : volume;
      nativeVideoRef.current.muted = isMuted;
      try {
        nativeVideoRef.current.load();
      } catch {}
    }
  }, [activeLesson.id, activeLesson.duration, customVideoUrl, playbackSpeed, isMuted, volume, stopAudio]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stopAudio]);

  // External autoPlayTrigger
  useEffect(() => {
    if (autoPlayTrigger && autoPlayTrigger > 0) {
      setCurrentTime(0);
      setIsPlaying(true);
      if (renderMode === 'studio' && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } else if (nativeVideoRef.current) {
        nativeVideoRef.current.currentTime = 0;
        nativeVideoRef.current.play().catch(() => {});
      }
    }
  }, [autoPlayTrigger, renderMode]);

  // Smooth animation frame loop synced with audio playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateFrame = () => {
      if (renderMode === 'studio') {
        if (audioRef.current && !audioRef.current.paused) {
          const aTime = audioRef.current.currentTime;
          setCurrentTime(aTime);
          if (aTime > maxReachedTimeRef.current) {
            maxReachedTimeRef.current = aTime;
          }
          watchedSecondsSetRef.current.add(Math.floor(aTime));

          const totalDur = activeLesson.duration || 57;
          if (aTime >= totalDur - 0.1) {
            setIsPlaying(false);
            if (onLessonComplete) onLessonComplete(activeLesson.id);
            return;
          }
        }
      } else if (nativeVideoRef.current && !nativeVideoRef.current.paused) {
        const vTime = nativeVideoRef.current.currentTime;
        setCurrentTime(vTime);
        if (vTime > maxReachedTimeRef.current) {
          maxReachedTimeRef.current = vTime;
        }
        watchedSecondsSetRef.current.add(Math.floor(vTime));
        const totalDur = activeLesson.duration || 57;
        if (vTime >= totalDur - 0.2) {
          setIsPlaying(false);
          if (onLessonComplete) onLessonComplete(activeLesson.id);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateFrame);
    };

    animationFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, renderMode, activeLesson.duration, activeLesson.id, onLessonComplete]);

  // Auto-hide controls timer
  const showAndScheduleHide = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (isPlaying && !isDragging) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying, isDragging]);

  const handleUserActivity = () => {
    showAndScheduleHide();
  };

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    } else {
      showAndScheduleHide();
    }
  }, [isPlaying, showAndScheduleHide]);

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    const totalDur = duration || activeLesson.duration || 57;

    if (!isPlaying) {
      if (currentTime >= totalDur - 0.3) {
        setCurrentTime(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        if (nativeVideoRef.current) nativeVideoRef.current.currentTime = 0;
      }

      setIsPlaying(true);

      if (renderMode === 'studio') {
        if (audioRef.current) {
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.muted = isMuted;
          audioRef.current.play().catch(() => {
            // Autoplay restriction fallback
          });
        }
      } else if (nativeVideoRef.current) {
        nativeVideoRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      if (nativeVideoRef.current) nativeVideoRef.current.pause();
    }
    showAndScheduleHide();
  };

  // Restart video from 00:00
  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    soundEffects.playClick();

    if (renderMode === 'studio' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = 0;
      nativeVideoRef.current.play().catch(() => {});
    }
    showAndScheduleHide();
  };

  // Step Jumper: Go to previous step
  const handlePrevStep = () => {
    soundEffects.playClick();
    const targetIdx = Math.max(0, activeSceneIndexSafe - 1);
    const targetTime = activeLesson.scenes[targetIdx]?.timeStart ?? 0;
    setCurrentTime(targetTime);

    if (renderMode === 'studio' && audioRef.current) {
      audioRef.current.currentTime = targetTime;
      if (!isPlaying) {
        setIsPlaying(true);
        audioRef.current.play().catch(() => {});
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = targetTime;
    }
    showAndScheduleHide();
  };

  // Step Jumper: Go to next step (forward skipping locked)
  const handleNextStep = () => {
    const targetIdx = Math.min(activeLesson.scenes.length - 1, activeSceneIndexSafe + 1);
    const targetTime = activeLesson.scenes[targetIdx]?.timeStart ?? 0;
    const allowedMax = Math.max(currentTime, maxReachedTimeRef.current);
    if (targetTime > allowedMax + 0.3) {
      triggerForwardBlockedNotice();
      soundEffects.playError();
      return;
    }
    soundEffects.playClick();
    setCurrentTime(targetTime);

    if (renderMode === 'studio' && audioRef.current) {
      audioRef.current.currentTime = targetTime;
      if (!isPlaying) {
        setIsPlaying(true);
        audioRef.current.play().catch(() => {});
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = targetTime;
    }
    showAndScheduleHide();
  };

  // Jump directly to a selected step (rewind allowed, forward locked)
  const handleSelectStep = (idx: number) => {
    const scene = activeLesson.scenes[idx];
    if (!scene) return;
    const allowedMax = Math.max(currentTime, maxReachedTimeRef.current);
    if (scene.timeStart > allowedMax + 0.3) {
      triggerForwardBlockedNotice();
      soundEffects.playError();
      return;
    }
    soundEffects.playClick();
    setCurrentTime(scene.timeStart);

    if (renderMode === 'studio' && audioRef.current) {
      audioRef.current.currentTime = scene.timeStart;
      if (!isPlaying) {
        setIsPlaying(true);
        audioRef.current.play().catch(() => {});
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = scene.timeStart;
    }
    showAndScheduleHide();
  };

  // Playback speed
  const handleSpeedChange = (spd: number) => {
    const safeSpeed = Math.min(1.5, Math.max(0.5, spd));
    setPlaybackSpeed(safeSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = safeSpeed;
    }
    if (nativeVideoRef.current) {
      nativeVideoRef.current.playbackRate = safeSpeed;
    }
    showAndScheduleHide();
  };

  // Volume & Mute
  const handleToggleMute = () => {
    if (isMuted) {
      const restoredVol = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.8;
      setVolume(restoredVol);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = restoredVol;
      }
      if (nativeVideoRef.current) {
        nativeVideoRef.current.muted = false;
        nativeVideoRef.current.volume = restoredVol;
      }
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
      if (nativeVideoRef.current) {
        nativeVideoRef.current.muted = true;
      }
    }
    showAndScheduleHide();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.muted = true;
      if (nativeVideoRef.current) nativeVideoRef.current.muted = true;
    } else {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = newVol;
      }
      if (nativeVideoRef.current) {
        nativeVideoRef.current.muted = false;
        nativeVideoRef.current.volume = newVol;
      }
    }
    showAndScheduleHide();
  };


  // Show quick friendly HUD alert when forward skipping is blocked
  const triggerForwardBlockedNotice = useCallback(() => {
    setForwardBlockedNotice(true);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setForwardBlockedNotice(false);
    }, 2400);
  }, []);

  // Dedicated seek helper: Backward allowed anytime, forward skipping is locked
  const seekTo = useCallback(
    (targetSeconds: number) => {
      const totalDur = duration || activeLesson.duration || 57;
      const clamped = Math.max(0, Math.min(totalDur, targetSeconds));
      const currentPos = currentTime;
      // Max boundary allowed: you can freely rewind to any previous moment, but forward skipping is prohibited
      const allowedMax = Math.max(currentPos, maxReachedTimeRef.current);

      if (clamped > allowedMax + 0.3) {
        // User tried to forward skip ahead: block and clamp to current time
        triggerForwardBlockedNotice();
        soundEffects.playError();
        return;
      }

      setCurrentTime(clamped);
      if (clamped > maxReachedTimeRef.current) {
        maxReachedTimeRef.current = clamped;
      }
      if (renderMode === 'studio' && audioRef.current) {
        audioRef.current.currentTime = clamped;
      } else if (nativeVideoRef.current) {
        nativeVideoRef.current.currentTime = clamped;
      }
      showAndScheduleHide();
    },
    [duration, activeLesson.duration, currentTime, renderMode, showAndScheduleHide, triggerForwardBlockedNotice]
  );

  // Interactive seeking along timeline
  const seekToClientX = (clientX: number) => {
    if (!progressTrackRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * (duration || activeLesson.duration || 57);
    seekTo(targetTime);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    seekToClientX(e.clientX);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      seekToClientX(e.clientX);
    } else if (progressTrackRef.current) {
      const rect = progressTrackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverPosition(ratio * 100);
      setHoverTime(ratio * (duration || activeLesson.duration || 57));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverTime(null);
    }
  };

  // Fullscreen Management: Native API + CSS Full-Viewport guarantees 100% full screen
  const enterFullscreen = () => {
    const el = containerRef.current as any;
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    }
    setIsFullscreen(true);
    showAndScheduleHide();
  };

  const exitFullscreen = () => {
    const doc = document as any;
    if (doc.exitFullscreen && doc.fullscreenElement) {
      doc.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen && doc.webkitFullscreenElement) {
      doc.webkitExitFullscreen();
    }
    setIsFullscreen(false);
    showAndScheduleHide();
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Keyboard accessibility: Every single key works properly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      // Space or K: Play/Pause toggle
      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        handleTogglePlay();
      }
      // ArrowLeft or J: Seek back 5s
      else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
        e.preventDefault();
        seekTo(currentTime - 5);
      }
      // ArrowRight or L: Seek forward 5s
      else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        seekTo(currentTime + 5);
      }
      // ArrowUp: Volume up (+10%)
      else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, Math.round((volume + 0.1) * 10) / 10);
        setVolume(newVol);
        setIsMuted(false);
        if (audioRef.current) {
          audioRef.current.volume = newVol;
          audioRef.current.muted = false;
        }
        if (nativeVideoRef.current) {
          nativeVideoRef.current.volume = newVol;
          nativeVideoRef.current.muted = false;
        }
        showAndScheduleHide();
      }
      // ArrowDown: Volume down (-10%)
      else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, Math.round((volume - 0.1) * 10) / 10);
        setVolume(newVol);
        if (newVol === 0) {
          setIsMuted(true);
          if (audioRef.current) audioRef.current.muted = true;
          if (nativeVideoRef.current) nativeVideoRef.current.muted = true;
        } else {
          setIsMuted(false);
          if (audioRef.current) {
            audioRef.current.volume = newVol;
            audioRef.current.muted = false;
          }
          if (nativeVideoRef.current) {
            nativeVideoRef.current.volume = newVol;
            nativeVideoRef.current.muted = false;
          }
        }
        showAndScheduleHide();
      }
      // M: Mute toggle
      else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
      // F: Fullscreen toggle (maximize/minimize)
      else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Escape: Exit fullscreen
      else if (e.code === 'Escape') {
        if (isFullscreen) {
          e.preventDefault();
          exitFullscreen();
        }
      }
      // R: Restart video from beginning (00:00)
      else if (e.code === 'KeyR') {
        e.preventDefault();
        handleRestart();
      }
      // Home: Jump to start
      else if (e.code === 'Home') {
        e.preventDefault();
        seekTo(0);
      }
      // End: Jump to end (forward skipping locked)
      else if (e.code === 'End') {
        e.preventDefault();
        triggerForwardBlockedNotice();
        soundEffects.playError();
      }
      // S: Toggle playback speed
      else if (e.code === 'KeyS') {
        e.preventDefault();
        handleSpeedChange(playbackSpeed === 1 ? 0.5 : 1);
      }
      // Number keys 1-7: Jump directly to Step 1 - Step 6 or Final Result
      else if (
        ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7',
         'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7'].includes(e.code)
      ) {
        e.preventDefault();
        const numStr = e.code.replace('Digit', '').replace('Numpad', '');
        const stepIdx = parseInt(numStr, 10) - 1;
        if (stepIdx >= 0 && stepIdx < activeLesson.scenes.length) {
          handleSelectStep(stepIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    duration,
    isPlaying,
    isMuted,
    volume,
    playbackSpeed,
    isFullscreen,
    showAndScheduleHide,
    activeLesson.scenes,
    seekTo,
    triggerForwardBlockedNotice,
  ]);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const videoTitle = customVideoName || activeLesson.title;

  return (
    <div className="w-full">
      {/* ─── LAPTOP-STYLE 16:9 CONTAINER ─── */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black flex items-center justify-center p-0'
            : 'w-full max-w-6xl mx-auto'
        }
      >
        {!isFullscreen && (
          <div className="bg-slate-900 dark:bg-slate-950 px-4 pt-3 pb-2 rounded-t-3xl border-t border-x border-slate-700/80 shadow-2xl flex items-center justify-between relative">
            {/* Window dot controls */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>

            {/* Centered Webcam and Active Sensor LED */}
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/80" />
              </div>
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'
                }`}
                title={isPlaying ? 'Camera / Display active' : 'Display idle'}
              />
            </div>

            <div className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>16:9 HD LAPTOP DISPLAY</span>
            </div>
          </div>
        )}

        {/* 16:9 Screen Display Window */}
        <div
          ref={containerRef}
          tabIndex={0}
          onMouseMove={handleUserActivity}
          onTouchStart={handleUserActivity}
          onClick={handleUserActivity}
          className={`relative w-full aspect-video overflow-hidden bg-slate-950 select-none font-sans transition-all duration-300 group focus:outline-none flex flex-col justify-between ${
            isFullscreen
              ? 'fixed inset-0 z-[9999] w-screen h-screen max-w-none max-h-none rounded-none border-none shadow-none'
              : 'border-x border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.7)]'
          }`}
        >
      {/* ─── HIDDEN REAL AUDIO ELEMENT: STUDIO NARRATION ENGINE ─── */}
      <audio
        ref={audioRef}
        key={audioSourceUrl}
        src={audioSourceUrl}
        preload="auto"
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => {
          if (renderMode === 'studio' && audioRef.current) {
            const aTime = audioRef.current.currentTime;
            setCurrentTime(aTime);
            if (aTime > maxReachedTimeRef.current) {
              maxReachedTimeRef.current = aTime;
            }
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onLessonComplete) onLessonComplete(activeLesson.id);
        }}
      />

      {/* ─── 1. VISUALIZATION CANVAS (Animated Studio Stage or Uploaded Video) ─── */}
      <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center overflow-hidden">
        {renderMode === 'studio' ? (
          <div className="w-full h-full p-2 sm:p-4 flex flex-col justify-between">
            {activeLesson.id === 1 ? (
              <Lesson1AnimatedStage
                currentScene={currentScene}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            ) : (
              <Lesson2AnimatedStage
                currentScene={currentScene}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            )}
          </div>
        ) : (
          <video
            ref={nativeVideoRef}
            key={`${activeLesson.id}-${videoSourceUrl}`}
            src={videoSourceUrl}
            preload="auto"
            playsInline
            onLoadedMetadata={() => {
              if (nativeVideoRef.current && nativeVideoRef.current.duration) {
                setDuration(nativeVideoRef.current.duration);
              }
            }}
            onDurationChange={() => {
              if (nativeVideoRef.current && nativeVideoRef.current.duration) {
                setDuration(nativeVideoRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (nativeVideoRef.current) {
                const vTime = nativeVideoRef.current.currentTime;
                const allowedMax = Math.max(currentTime, maxReachedTimeRef.current);
                const totalDur = activeLesson.duration || duration || 57;
                if (vTime > allowedMax + 3.0 && vTime < totalDur - 1.0) {
                  nativeVideoRef.current.currentTime = allowedMax;
                  setCurrentTime(allowedMax);
                  triggerForwardBlockedNotice();
                  return;
                }
                setCurrentTime(vTime);
                if (vTime > maxReachedTimeRef.current) {
                  maxReachedTimeRef.current = vTime;
                }
                if (vTime >= totalDur - 0.5) {
                  if (onLessonComplete) onLessonComplete(activeLesson.id);
                }
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              if (onLessonComplete) onLessonComplete(activeLesson.id);
            }}
            onClick={handleTogglePlay}
            className="w-full h-full object-contain bg-black cursor-pointer"
          >
            <source src={videoSourceUrl} type="video/mp4" />
            <source src={`/dsa-modules/dsa-types/Videos/${encodeURIComponent(activeLesson.filename)}`} type="video/mp4" />
            <source src={`/videos/${encodeURIComponent(activeLesson.filename)}`} type="video/mp4" />
            <source src={`./Videos/${encodeURIComponent(activeLesson.filename)}`} type="video/mp4" />
            {publicVideoUrl !== videoSourceUrl && <source src={publicVideoUrl} type="video/mp4" />}
            {encodedPublicVideoUrl !== videoSourceUrl && (
              <source src={encodedPublicVideoUrl} type="video/mp4" />
            )}
            Your browser does not support HTML5 video.
          </video>
        )}
      </div>

            {/* ─── FORWARD SKIP LOCKED TOAST NOTIFICATION ─── */}
      {forwardBlockedNotice && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500/95 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 pointer-events-none animate-bounce border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-slate-950" />
          <span>Forward skip disabled: Watch video to learn before progressing. Rewinding is fully allowed!</span>
        </div>
      )}

      {/* ─── 2. TOP HUD BAR: STEP CHIPS & LESSON TITLE ─── */}
      <div
        className={`relative z-30 w-full p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-opacity duration-300 pointer-events-auto ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Title & Active Step Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold tracking-wide uppercase shadow-lg flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[170px] sm:max-w-[280px]">{videoTitle}</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-full bg-indigo-950/90 backdrop-blur-md border border-indigo-500/50 text-indigo-300 text-[11px] sm:text-xs font-mono font-bold shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>
              {activeSceneIndexSafe < 6 ? `Step ${activeSceneIndexSafe + 1} of 6` : 'Final Result'}
            </span>
          </div>
        </div>

        {/* Center: Step Selector Stepper (Interactive Step Buttons 1 -> 6 -> Final) */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
          {activeLesson.scenes.map((scene, idx) => {
            const isCurrent = idx === activeSceneIndexSafe;
            const isCompleted = currentTime >= scene.timeEnd;
            return (
              <button
                key={scene.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStep(idx);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md scale-105'
                    : isCompleted
                    ? 'bg-slate-800/80 text-emerald-400 border border-emerald-500/40 hover:bg-slate-700'
                    : 'bg-black/60 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title={scene.title}
              >
                <span>{idx < 6 ? `S${idx + 1}` : 'Result'}</span>
                {isCompleted && <CheckCircle2 className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>

        {/* Right: Mode Switcher, Timer & Fullscreen Toggle */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenderMode((prev) => (prev === 'studio' ? 'video' : 'studio'));
            }}
            className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
            title="Toggle between Animated Working Flow and HD Video Stream"
          >
            {renderMode === 'studio' ? <Video className="w-3 h-3 text-indigo-400" /> : <MonitorPlay className="w-3 h-3 text-emerald-400" />}
            <span>{renderMode === 'studio' ? 'Animated Flow' : 'Video Stream'}</span>
          </button>

          <div className="px-2.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 text-slate-200 text-[11px] sm:text-xs font-mono font-semibold shadow-lg">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-white border border-white/20 text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            aria-label="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── 3. CENTER PLAY OVERLAY WHEN PAUSED OR COMPLETED ─── */}
      {!isPlaying && (
        <div
          onClick={handleTogglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer transition-opacity"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/95 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.8)] transition-transform transform hover:scale-110 active:scale-95 cursor-pointer">
            {currentTime >= duration - 0.5 ? (
              <RotateCcw className="w-8 h-8 sm:w-9 sm:h-9" />
            ) : (
              <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current ml-1" />
            )}
          </div>
        </div>
      )}

      {/* ─── 4. BOTTOM FLOATING CONTROL PANEL ─── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-30 w-full p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-white space-y-2.5 transition-opacity duration-300 pointer-events-auto ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Progress Bar with Step Dividing Markers */}
        <div className="relative w-full group/seek select-none">
          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className={`absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold pointer-events-none shadow-md ${
                hoverTime > Math.max(currentTime, maxReachedTimeRef.current) + 0.3
                  ? 'bg-rose-950/90 border border-rose-500/50 text-rose-300'
                  : 'bg-black/95 border border-white/20 text-white'
              }`}
              style={{ left: `${hoverPosition}%` }}
            >
              {hoverTime > Math.max(currentTime, maxReachedTimeRef.current) + 0.3
                ? `${formatTime(hoverTime)} (Locked)`
                : formatTime(hoverTime)}
            </div>
          )}

          <div
            ref={progressTrackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="relative w-full h-5 flex items-center cursor-pointer touch-none"
            role="slider"
            aria-label="Seek Video Timeline"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          >
            {/* Background Track with Step Dividers */}
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden relative">
              {/* Allowed / Watched range buffer */}
              <div
                className="absolute top-0 bottom-0 bg-white/10 rounded-full pointer-events-none"
                style={{ width: `${Math.min(100, Math.max(0, (maxReachedTimeRef.current / (duration || 57)) * 100))}%` }}
              />
              {/* Active Filled Gradient */}
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-400 rounded-full transition-[width] duration-75 relative z-1"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Step Divider Markers */}
              {activeLesson.scenes.map((scene, sIdx) => {
                if (sIdx === 0) return null;
                const markerLeft = (scene.timeStart / duration) * 100;
                return (
                  <div
                    key={sIdx}
                    className="absolute top-0 bottom-0 w-0.5 bg-black/70 pointer-events-none"
                    style={{ left: `${markerLeft}%` }}
                  />
                );
              })}
            </div>

            {/* Scrubber Thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-transform duration-75 pointer-events-none ${
                isDragging ? 'scale-125 ring-4 ring-indigo-500/40' : 'group-hover/seek:scale-125'
              }`}
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>
        </div>

        {/* CONTROLS ROW */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          {/* LEFT: Play/Pause, Step Navigation, Restart, Volume */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Play / Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_18px_rgba(99,102,241,0.5)] active:scale-95 transition-all cursor-pointer tracking-wider"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Prev Step Button */}
            <button
              onClick={handlePrevStep}
              disabled={activeSceneIndexSafe === 0}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-white/10"
              title="Previous Step (Left Arrow)"
              aria-label="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next Step Button */}
            <button
              onClick={handleNextStep}
              disabled={activeSceneIndexSafe === activeLesson.scenes.length - 1}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-white/10"
              title="Next Step (Right Arrow)"
              aria-label="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-white/10"
              title="Restart from Step 1 (R)"
              aria-label="Restart video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume & Mute */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white">
              <button
                onClick={handleToggleMute}
                className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center justify-center"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
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
                className="w-14 sm:w-20 h-1.5 rounded-full accent-indigo-500 bg-white/20 cursor-pointer"
                aria-label="Volume Slider"
              />
            </div>
          </div>

          {/* RIGHT: Speed Controls & Current Step Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Playback Speed (0.5x, 1x) */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/10 border border-white/10 text-xs font-mono font-bold">
              {[0.5, 1].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.6)] font-bold ring-1 ring-indigo-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label={`Playback speed ${spd}x`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Step Badge */}
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-mono font-bold text-indigo-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeSceneIndexSafe < 6 ? `Step ${activeSceneIndexSafe + 1}/6` : 'Final'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

        {!isFullscreen && (
          <div className="relative select-none pointer-events-none">
            {/* Center Display Hinge */}
            <div className="h-2 sm:h-2.5 w-3/4 mx-auto bg-slate-800 dark:bg-slate-900 border-x border-slate-700/70" />
            {/* Metallic Keyboard Deck Base with Notch */}
            <div className="h-4 sm:h-5 w-full bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 rounded-b-2xl border-b border-x border-slate-300 dark:border-slate-700 shadow-2xl flex items-center justify-center">
              {/* Ergonomic Opening Thumb Notch */}
              <div className="w-20 sm:w-28 h-1.5 bg-slate-400/80 dark:bg-slate-700 rounded-b-md shadow-inner" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
