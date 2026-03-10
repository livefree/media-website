"use client";

import Hls from "hls.js";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { MediaEpisodeOption, MediaItem, PlaybackSourceOption } from "../../types/media";
import { consumeAutoplayIntentForHref, setAutoplayIntentForHref } from "./autoplay-intent";
import styles from "../detail/detail-page.module.css";

const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 0.05;
const SPEED_STEP = 0.05;
const SPEED_PRESETS = [1, 1.25, 1.5, 2];
const MEDIA_PROGRESS_EVENT = "media-progress-updated";
const RESUME_EXCLUSION_SECONDS = 30;
const RESUME_SNAP_SECONDS = 5;
const DEFAULT_CHROME_HIDE_DELAY_MS = 1800;
const IMMERSIVE_CHROME_HIDE_DELAY_MS = 3000;

type StoredPlaybackProgress = {
  currentTime: number;
  duration: number;
  updatedAt: number;
  completed: boolean;
};

type EpisodeNavigationOption = MediaEpisodeOption & {
  href: string;
  isActive: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0:00";
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRateLabel(rate: number) {
  const trimmed = rate.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return `${trimmed}x`;
}

function isHlsSource(source: PlaybackSourceOption | null) {
  if (!source) {
    return false;
  }

  return source.provider === "m3u8" || source.format.toLowerCase().includes("m3u8") || source.url.includes(".m3u8");
}

function buildProgressKey(mediaSlug: string, episodeSlug?: string) {
  return `media-progress:${mediaSlug}:${episodeSlug ?? "feature"}`;
}

function readStoredProgress(progressKey: string): StoredPlaybackProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(progressKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredPlaybackProgress;
  } catch {
    return null;
  }
}

function persistStoredProgress(progressKey: string, progress: StoredPlaybackProgress) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(progressKey, JSON.stringify(progress));
}

function clearStoredProgress(progressKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(progressKey);
}

function snapResumeTime(currentTime: number) {
  return Math.floor(currentTime / RESUME_SNAP_SECONDS) * RESUME_SNAP_SECONDS;
}

function isResumableTime(currentTime: number, duration: number) {
  return (
    Number.isFinite(duration) &&
    duration > RESUME_EXCLUSION_SECONDS * 2 &&
    currentTime >= RESUME_EXCLUSION_SECONDS &&
    duration - currentTime > RESUME_EXCLUSION_SECONDS
  );
}

function sanitizeStoredProgress(progress: StoredPlaybackProgress | null) {
  if (!progress) {
    return null;
  }

  if (progress.completed) {
    return progress;
  }

  if (!isResumableTime(progress.currentTime, progress.duration)) {
    return null;
  }

  const snappedTime = snapResumeTime(progress.currentTime);
  if (!isResumableTime(snappedTime, progress.duration)) {
    return null;
  }

  if (snappedTime === progress.currentTime) {
    return progress;
  }

  return {
    ...progress,
    currentTime: snappedTime,
  };
}

function ControlShell({
  tooltip,
  align = "center",
  children,
}: {
  tooltip: string;
  align?: "center" | "start";
  children: ReactNode;
}) {
  return (
    <div className={styles.playerControlShell}>
      {children}
      <span
        role="tooltip"
        className={`${styles.playerTooltip} ${align === "start" ? styles.playerTooltipStart : ""}`.trim()}
      >
        {tooltip}
      </span>
    </div>
  );
}

function PlayIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M8 6.5v11l8.5-5.5L8 6.5Z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <rect x="7" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

function NextEpisodeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M6 6.5v11l7.3-5.5L6 6.5Z" fill="currentColor" />
      <path d="M13 6.5v11l5.7-4.2V17h2V7h-2v3.7L13 6.5Z" fill="currentColor" />
    </svg>
  );
}

function EpisodeListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M6 7.5h3.2M6 12h3.2M6 16.5h3.2M11.5 7.5H18M11.5 12H18M11.5 16.5H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume <= 0.01) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
        <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
        <path d="m16 9.3 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }

  if (volume <= 0.33) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
        <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
        <path d="M15.2 10.1a3.4 3.4 0 0 1 0 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  if (volume <= 0.66) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
        <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
        <path
          d="M15.2 10.1a3.4 3.4 0 0 1 0 3.8M17.6 8.5a5.8 5.8 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
      <path
        d="M15.2 10.1a3.4 3.4 0 0 1 0 3.8M17.6 8.5a5.8 5.8 0 0 1 0 7M20 6.7a8.4 8.4 0 0 1 0 10.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path
        d="M5.5 15.4a7 7 0 1 1 13 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="m12 12.2 4.2-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12.2" r="1.4" fill="currentColor" />
    </svg>
  );
}

function TheaterIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <rect x="4.5" y="6.3" width="15" height="11.4" rx="1.8" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path
        d={active ? "M9.2 9.4 7 11.6m0 0 2.2 2.2M15 9.4l2.2 2.2m0 0-2.2 2.2" : "M8.4 9.1 6.7 7.4m1.7 1.7H6.9V7.6m8.7 1.5 1.7-1.7m-1.7 1.7h1.5V7.6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path
        d={
          active
            ? "M9.1 5.7H5.7v3.4M18.3 9.1V5.7h-3.4M14.9 18.3h3.4v-3.4M5.7 14.9v3.4h3.4"
            : "M8.9 5.7H5.7v3.2M15.1 5.7h3.2v3.2M18.3 15.1v3.2h-3.2M8.9 18.3H5.7v-3.2"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {!active ? (
        <path
          d="M9.3 9.3 5.9 5.9M14.7 9.3l3.4-3.4M14.7 14.7l3.4 3.4M9.3 14.7l-3.4 3.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export function PlayerShell({
  media,
  playbackTitle,
  source,
  availableSources = [],
  episodes = [],
  activeEpisode,
  nextEpisodeHref,
  nextEpisodeLabel,
}: {
  media: MediaItem;
  playbackTitle: string;
  source: PlaybackSourceOption | null;
  availableSources?: PlaybackSourceOption[];
  episodes?: EpisodeNavigationOption[];
  activeEpisode?: MediaEpisodeOption;
  nextEpisodeHref?: string;
  nextEpisodeLabel?: string;
}) {
  const router = useRouter();
  const rateSliderId = useId();
  const volumeSliderId = useId();
  const playerRef = useRef<HTMLDivElement | null>(null);
  const speedPanelRef = useRef<HTMLDivElement | null>(null);
  const speedButtonRef = useRef<HTMLButtonElement | null>(null);
  const episodePanelRef = useRef<HTMLDivElement | null>(null);
  const episodeButtonRef = useRef<HTMLButtonElement | null>(null);
  const episodeListRef = useRef<HTMLDivElement | null>(null);
  const episodeItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastPersistedTimeRef = useRef(0);
  const pendingResumeRef = useRef<StoredPlaybackProgress | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const volumeRevealTimeoutRef = useRef<number | null>(null);
  const cursorHideTimeoutRef = useRef<number | null>(null);
  const shouldAutoplayOnLoadRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedUntil, setBufferedUntil] = useState(0);
  const [volume, setVolume] = useState(1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [focusedEpisodeIndex, setFocusedEpisodeIndex] = useState(-1);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [interactionTick, setInteractionTick] = useState(0);
  const [isFocusWithinPlayer, setIsFocusWithinPlayer] = useState(false);
  const [isVolumeExpanded, setIsVolumeExpanded] = useState(false);
  const [isVolumeTemporarilyVisible, setIsVolumeTemporarilyVisible] = useState(false);
  const [isCursorHidden, setIsCursorHidden] = useState(false);

  const progressKey = useMemo(
    () => buildProgressKey(media.slug, activeEpisode?.slug),
    [activeEpisode?.slug, media.slug],
  );
  const isImmersiveMode = isTheaterMode || isFullscreen;
  const activeEpisodeIndex = useMemo(
    () => episodes.findIndex((episode) => episode.isActive),
    [episodes],
  );
  const currentTimeLabel = formatTime(currentTime);
  const durationLabel = formatTime(duration);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedUntil / duration) * 100 : 0;
  const statusLabel = useMemo(() => {
    const labels = [activeEpisode?.title, source?.providerLabel, source?.quality, media.status];
    return labels.filter(Boolean).join(" · ");
  }, [activeEpisode?.title, media.status, source?.providerLabel, source?.quality]);

  function closeSpeedPanel() {
    setShowSpeedPanel(false);
  }

  function closeEpisodePanel() {
    setShowEpisodePanel(false);
  }

  function closeTransientPanels() {
    closeSpeedPanel();
    closeEpisodePanel();
  }

  function clearHideControlsTimeout() {
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  }

  function clearVolumeRevealTimeout() {
    if (volumeRevealTimeoutRef.current !== null) {
      window.clearTimeout(volumeRevealTimeoutRef.current);
      volumeRevealTimeoutRef.current = null;
    }
  }

  function clearCursorHideTimeout() {
    if (cursorHideTimeoutRef.current !== null) {
      window.clearTimeout(cursorHideTimeoutRef.current);
      cursorHideTimeoutRef.current = null;
    }
  }

  function temporarilyRevealVolume() {
    setIsVolumeTemporarilyVisible(true);
    clearVolumeRevealTimeout();
    volumeRevealTimeoutRef.current = window.setTimeout(() => {
      setIsVolumeTemporarilyVisible(false);
    }, 1200);
  }

  function revealControls() {
    setIsControlsVisible(true);
    setIsCursorHidden(false);
    setInteractionTick((value) => value + 1);
  }

  function emitProgress(progress: StoredPlaybackProgress) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(MEDIA_PROGRESS_EVENT, {
        detail: {
          mediaSlug: media.slug,
          episodeSlug: activeEpisode?.slug,
          progress,
        },
      }),
    );
  }

  function clearProgress(nextDuration: number) {
    if (!progressKey || typeof window === "undefined") {
      return;
    }

    clearStoredProgress(progressKey);
    lastPersistedTimeRef.current = 0;
    emitProgress({
      currentTime: 0,
      duration: nextDuration,
      updatedAt: Date.now(),
      completed: false,
    });
  }

  function saveProgress(time: number, nextDuration: number, completed: boolean) {
    if (!progressKey || typeof window === "undefined") {
      return;
    }

    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      clearProgress(0);
      return;
    }

    if (completed || nextDuration - time <= RESUME_EXCLUSION_SECONDS) {
      const completionProgress: StoredPlaybackProgress = {
        currentTime: nextDuration,
        duration: nextDuration,
        updatedAt: Date.now(),
        completed: true,
      };

      persistStoredProgress(progressKey, completionProgress);
      lastPersistedTimeRef.current = nextDuration;
      emitProgress(completionProgress);
      return;
    }

    if (!isResumableTime(time, nextDuration)) {
      clearProgress(nextDuration);
      return;
    }

    const normalizedTime = snapResumeTime(Math.max(0, time));
    if (!isResumableTime(normalizedTime, nextDuration)) {
      clearProgress(nextDuration);
      return;
    }

    const progress: StoredPlaybackProgress = {
      currentTime: normalizedTime,
      duration: nextDuration,
      updatedAt: Date.now(),
      completed: false,
    };

    persistStoredProgress(progressKey, progress);
    lastPersistedTimeRef.current = normalizedTime;
    emitProgress(progress);
  }

  useEffect(() => {
    clearHideControlsTimeout();
    clearCursorHideTimeout();

    if (
      !isPlaying ||
      showSpeedPanel ||
      showEpisodePanel ||
      isVolumeExpanded ||
      isVolumeTemporarilyVisible ||
      isFocusWithinPlayer ||
      playbackError
    ) {
      setIsControlsVisible(true);
      setIsCursorHidden(false);
      return;
    }

    if (isImmersiveMode) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setIsControlsVisible(false);
        setIsCursorHidden(true);
      }, IMMERSIVE_CHROME_HIDE_DELAY_MS);
    } else {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setIsControlsVisible(false);
      }, DEFAULT_CHROME_HIDE_DELAY_MS);
      cursorHideTimeoutRef.current = window.setTimeout(() => {
        setIsCursorHidden(true);
      }, DEFAULT_CHROME_HIDE_DELAY_MS);
    }

    return () => {
      clearHideControlsTimeout();
      clearCursorHideTimeout();
    };
  }, [interactionTick, isFocusWithinPlayer, isImmersiveMode, isPlaying, isVolumeExpanded, isVolumeTemporarilyVisible, playbackError, showEpisodePanel, showSpeedPanel]);

  useEffect(() => {
    return () => {
      clearHideControlsTimeout();
      clearVolumeRevealTimeout();
      clearCursorHideTimeout();
    };
  }, []);

  useEffect(() => {
    if (!isTheaterMode) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isTheaterMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!showSpeedPanel) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        speedPanelRef.current?.contains(target) ||
        speedButtonRef.current?.contains(target)
      ) {
        return;
      }

      closeSpeedPanel();
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [showSpeedPanel]);

  useEffect(() => {
    if (!showEpisodePanel) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        episodePanelRef.current?.contains(target) ||
        episodeButtonRef.current?.contains(target)
      ) {
        return;
      }

      closeEpisodePanel();
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [showEpisodePanel]);

  useEffect(() => {
    if (!showEpisodePanel || episodes.length === 0) {
      return;
    }

    const nextIndex = activeEpisodeIndex >= 0 ? activeEpisodeIndex : 0;
    setFocusedEpisodeIndex(nextIndex);

    window.requestAnimationFrame(() => {
      const target = episodeItemRefs.current[nextIndex];
      target?.focus({ preventScroll: true });
      const container = episodeListRef.current;
      if (container && target) {
        const nextTop = Math.max(0, target.offsetTop - (container.clientHeight - target.offsetHeight) / 2);
        container.scrollTo({ top: nextTop });
      }
    });
  }, [activeEpisodeIndex, episodes.length, showEpisodePanel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source?.url) {
      return undefined;
    }

    const storedProgress = readStoredProgress(progressKey);
    const sanitizedProgress = sanitizeStoredProgress(storedProgress);
    pendingResumeRef.current = sanitizedProgress;
    lastPersistedTimeRef.current = 0;
    shouldAutoplayOnLoadRef.current = consumeAutoplayIntentForHref();
    setPlaybackError(null);
    setCurrentTime(0);
    setDuration(0);
    setBufferedUntil(0);
    setIsPlaying(false);

    if (storedProgress && !sanitizedProgress) {
      clearProgress(storedProgress.duration);
    } else if (
      storedProgress &&
      sanitizedProgress &&
      !sanitizedProgress.completed &&
      sanitizedProgress.currentTime !== storedProgress.currentTime
    ) {
      persistStoredProgress(progressKey, sanitizedProgress);
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    if (isHlsSource(source) && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hlsRef.current = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlaybackError("当前播放源暂时无法播放，请切换其他源后重试。");
        }
      });
    } else {
      video.src = source.url;
    }

    video.muted = isMuted;
    video.volume = volume;
    video.playbackRate = playbackRate;
    video.preload = "auto";
    video.pause();

    return () => {
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [progressKey, source?.id, source?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const persistCurrentState = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      saveProgress(video.currentTime, video.duration, false);
    };

    window.addEventListener("beforeunload", persistCurrentState);
    return () => {
      persistCurrentState();
      window.removeEventListener("beforeunload", persistCurrentState);
    };
  }, [progressKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        if (activeElement.isContentEditable || activeElement.tagName === "TEXTAREA") {
          return;
        }

        if (activeElement instanceof HTMLInputElement) {
          const inputType = activeElement.type.toLowerCase();
          const isTextEntryInput =
            inputType === "" ||
            inputType === "text" ||
            inputType === "search" ||
            inputType === "email" ||
            inputType === "password" ||
            inputType === "tel" ||
            inputType === "url" ||
            inputType === "number";

          if (isTextEntryInput) {
            return;
          }

          if (inputType === "range" && event.key !== "m" && event.key !== "M") {
            return;
          }
        }
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (showEpisodePanel && episodes.length > 0) {
        switch (event.key) {
          case "ArrowLeft":
          case "ArrowUp":
            event.preventDefault();
            focusEpisodeByIndex((focusedEpisodeIndex >= 0 ? focusedEpisodeIndex : activeEpisodeIndex) - 1);
            return;
          case "ArrowRight":
          case "ArrowDown":
            event.preventDefault();
            focusEpisodeByIndex((focusedEpisodeIndex >= 0 ? focusedEpisodeIndex : activeEpisodeIndex) + 1);
            return;
          case "Enter":
            event.preventDefault();
            if (focusedEpisodeIndex >= 0) {
              navigateToEpisode(episodes[focusedEpisodeIndex].href, true);
            }
            return;
          case "Escape":
            event.preventDefault();
            closeEpisodePanel();
            return;
          default:
            break;
        }
      }

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          void togglePlayback();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-SEEK_STEP_SECONDS);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(SEEK_STEP_SECONDS);
          break;
        case "ArrowUp":
          event.preventDefault();
          updateVolume(volume + VOLUME_STEP);
          break;
        case "ArrowDown":
          event.preventDefault();
          updateVolume(volume - VOLUME_STEP);
          break;
        case "m":
        case "M":
          event.preventDefault();
          toggleMute();
          break;
        case "s":
        case "S":
          event.preventDefault();
          revealControls();
          closeEpisodePanel();
          setShowSpeedPanel((value) => !value);
          break;
        case "e":
        case "E":
          if (episodes.length > 0) {
            event.preventDefault();
            toggleEpisodePanel();
          }
          break;
        case "[":
          event.preventDefault();
          updatePlaybackRate(playbackRate - SPEED_STEP);
          break;
        case "]":
          event.preventDefault();
          updatePlaybackRate(playbackRate + SPEED_STEP);
          break;
        case "1":
          event.preventDefault();
          updatePlaybackRate(1);
          break;
        case "2":
          event.preventDefault();
          updatePlaybackRate(1.25);
          break;
        case "3":
          event.preventDefault();
          updatePlaybackRate(1.5);
          break;
        case "4":
          event.preventDefault();
          updatePlaybackRate(2);
          break;
        case "t":
        case "T":
          event.preventDefault();
          toggleTheaterMode();
          break;
        case "f":
        case "F":
          event.preventDefault();
          void toggleFullscreen();
          break;
        case "n":
        case "N":
          if (nextEpisodeHref) {
            event.preventDefault();
            navigateToEpisode(nextEpisodeHref, true);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [activeEpisodeIndex, episodes, focusedEpisodeIndex, isMuted, nextEpisodeHref, playbackRate, previousVolume, router, showEpisodePanel, volume]);

  async function togglePlayback() {
    closeTransientPanels();
    revealControls();
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setPlaybackError("浏览器阻止了自动播放，请手动点击播放。");
      }
      return;
    }

    video.pause();
    setIsPlaying(false);
  }

  function seekBy(delta: number) {
    closeTransientPanels();
    revealControls();
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextTime = clamp(
      video.currentTime + delta,
      0,
      Number.isFinite(video.duration) ? video.duration : video.currentTime + delta,
    );
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleSeek(nextTime: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) {
      return;
    }

    closeTransientPanels();
    revealControls();
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function updateVolume(nextVolume: number) {
    closeTransientPanels();
    revealControls();
    temporarilyRevealVolume();
    const safeVolume = clamp(nextVolume, 0, 1);
    const video = videoRef.current;

    setVolume(safeVolume);
    setIsMuted(safeVolume <= 0.001);
    if (safeVolume > 0) {
      setPreviousVolume(safeVolume);
    }
    if (video) {
      video.volume = safeVolume;
      video.muted = safeVolume <= 0.001;
    }
  }

  function toggleMute() {
    closeTransientPanels();
    revealControls();
    const video = videoRef.current;

    if (isMuted || volume <= 0.001) {
      const restored = previousVolume > 0 ? previousVolume : 0.65;
      setIsMuted(false);
      setVolume(restored);
      if (video) {
        video.muted = false;
        video.volume = restored;
      }
      temporarilyRevealVolume();
      return;
    }

    setPreviousVolume(volume);
    setIsMuted(true);
    if (video) {
      video.muted = true;
    }
    temporarilyRevealVolume();
  }

  function updatePlaybackRate(nextRate: number) {
    closeEpisodePanel();
    revealControls();
    setPlaybackRate(Number(clamp(nextRate, 0.25, 2).toFixed(2)));
  }

  function toggleTheaterMode() {
    closeTransientPanels();
    revealControls();
    setIsTheaterMode((value) => !value);
  }

  async function toggleFullscreen() {
    closeTransientPanels();
    revealControls();
    const element = playerRef.current;
    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  }

  function focusEpisodeByIndex(nextIndex: number) {
    const clampedIndex = clamp(nextIndex, 0, episodes.length - 1);
    setFocusedEpisodeIndex(clampedIndex);
    window.requestAnimationFrame(() => {
      const container = episodeListRef.current;
      const target = episodeItemRefs.current[clampedIndex];
      target?.focus({ preventScroll: true });
      if (container && target) {
        const nextTop = Math.max(0, target.offsetTop - (container.clientHeight - target.offsetHeight) / 2);
        container.scrollTo({ top: nextTop });
      }
    });
  }

  function navigateToEpisode(href: string, autoplay = false) {
    closeTransientPanels();
    if (autoplay) {
      setAutoplayIntentForHref(href);
    }
    router.push(href, { scroll: false });
  }

  function toggleEpisodePanel() {
    revealControls();
    closeSpeedPanel();
    setShowEpisodePanel((value) => !value);
  }

  const wrapperClassName = [
    styles.playerViewportWrap,
    isTheaterMode ? styles.playerViewportWrapTheater : "",
    isFullscreen ? styles.playerViewportWrapFullscreen : "",
    isCursorHidden ? styles.playerCursorHidden : "",
  ]
    .filter(Boolean)
    .join(" ");

  const viewportClassName = [
    styles.playerViewport,
    isTheaterMode || isFullscreen ? styles.playerViewportImmersive : "",
  ]
    .filter(Boolean)
    .join(" ");
  const chromeClassName = [
    styles.playerChrome,
    isControlsVisible ? styles.playerChromeVisible : styles.playerChromeHidden,
  ]
    .filter(Boolean)
    .join(" ");
  const immersiveTitleClassName = [
    styles.playerImmersiveTitle,
    isControlsVisible ? styles.playerImmersiveTitleVisible : styles.playerImmersiveTitleHidden,
  ]
    .filter(Boolean)
    .join(" ");
  const volumeDockClassName = [
    styles.playerVolumeDock,
    isVolumeExpanded || isVolumeTemporarilyVisible ? styles.playerVolumeDockExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  const volumeSliderStyle = { "--fill": `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties;
  const speedSliderStyle = {
    "--fill": `${((playbackRate - 0.25) / 1.75) * 100}%`,
  } as CSSProperties;
  const volumeTooltip = isMuted ? "Unmute (M / ↑ / ↓)" : "Mute (M) / Volume (↑ / ↓)";
  const playTooltip = isPlaying ? "Pause (K / Space)" : "Play (K / Space)";
  const speedButtonLabel = formatRateLabel(playbackRate);
  const episodeButtonLabel = activeEpisode ? `${activeEpisode.episodeNumber}` : "1";

  return (
    <>
      <div
        ref={playerRef}
        className={wrapperClassName}
        onMouseMove={revealControls}
        onMouseEnter={revealControls}
        onMouseLeave={() => {
          if (isImmersiveMode) {
            return;
          }

          clearHideControlsTimeout();
          clearCursorHideTimeout();
          if (isPlaying && !showSpeedPanel && !showEpisodePanel && !isVolumeExpanded && !isFocusWithinPlayer) {
            setIsControlsVisible(false);
            setIsCursorHidden(true);
          }
        }}
        onTouchStart={revealControls}
        onFocusCapture={() => {
          setIsFocusWithinPlayer(true);
          revealControls();
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsFocusWithinPlayer(false);
          }
        }}
      >
        {isTheaterMode || isFullscreen ? (
          <div className={immersiveTitleClassName}>
            <span className={styles.playerImmersiveTitleText}>{playbackTitle}</span>
          </div>
        ) : null}

        <div className={viewportClassName}>
          {media.backdropUrl ? (
            <div className={styles.playerBackdrop} style={{ backgroundImage: `url(${media.backdropUrl})` }} aria-hidden="true" />
          ) : null}

          <video
            ref={videoRef}
            className={styles.playerVideo}
            playsInline
            preload="auto"
            poster={media.posterUrl}
            onClick={() => void togglePlayback()}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              const nextDuration = video.duration || 0;
              setDuration(nextDuration);
              const saved = pendingResumeRef.current;
              if (
                saved &&
                !saved.completed &&
                isResumableTime(saved.currentTime, nextDuration)
              ) {
                video.currentTime = saved.currentTime;
                setCurrentTime(saved.currentTime);
                video.pause();
              }

              if (shouldAutoplayOnLoadRef.current) {
                shouldAutoplayOnLoadRef.current = false;
                const autoplayAttempt = video.play();
                if (autoplayAttempt) {
                  void autoplayAttempt.then(() => {
                    setIsPlaying(true);
                  }).catch(() => {
                    setIsPlaying(false);
                  });
                }
              }
            }}
            onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              setCurrentTime(video.currentTime);
              if (!Number.isFinite(video.duration) || video.duration <= 0 || !isResumableTime(video.currentTime, video.duration)) {
                return;
              }

              const snappedTime = snapResumeTime(video.currentTime);
              if (snappedTime >= RESUME_EXCLUSION_SECONDS && snappedTime !== lastPersistedTimeRef.current) {
                saveProgress(video.currentTime, video.duration, false);
              }
            }}
            onProgress={(event) => {
              const buffered = event.currentTarget.buffered;
              if (buffered.length > 0) {
                setBufferedUntil(buffered.end(buffered.length - 1));
              }
            }}
            onError={() => setPlaybackError("视频加载失败，请尝试切换播放源。")}
            onEnded={() => {
              const video = videoRef.current;
              if (video && Number.isFinite(video.duration)) {
                saveProgress(video.duration, video.duration, true);
              }
              setIsPlaying(false);
              if (nextEpisodeHref) {
                navigateToEpisode(nextEpisodeHref, true);
              }
            }}
          />

          <div className={chromeClassName}>
            <div className={styles.playerChromeSurface}>
              <label className={styles.playerProgressRail} aria-label="播放进度">
                <span className={styles.playerProgressTrack} aria-hidden="true">
                  <span className={styles.playerProgressBuffered} style={{ width: `${bufferedPercent}%` }} />
                  <span className={styles.playerProgressPlayed} style={{ width: `${progressPercent}%` }} />
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(event) => handleSeek(Number(event.currentTarget.value))}
                  className={styles.playerProgressInput}
                />
              </label>

              <div className={styles.playerControlRail}>
                <div className={styles.playerPrimaryCluster}>
                <ControlShell tooltip={playTooltip} align="start">
                  <button
                    type="button"
                    className={styles.playerControlButton}
                    onClick={() => void togglePlayback()}
                    aria-label={playTooltip}
                  >
                    <PlayIcon paused={!isPlaying} />
                  </button>
                </ControlShell>

                {nextEpisodeHref ? (
                  <div className={styles.playerEpisodeEntryGroup}>
                    <ControlShell tooltip={`Next Episode (N)`}>
                      <button
                        type="button"
                        className={styles.playerControlButton}
                        onClick={() => navigateToEpisode(nextEpisodeHref, true)}
                        aria-label={`下一集 ${nextEpisodeLabel ?? ""} (N)`}
                      >
                        <NextEpisodeIcon />
                      </button>
                    </ControlShell>

                    {episodes.length > 0 ? (
                      <div
                        className={`${styles.playerEpisodeDock} ${showEpisodePanel ? styles.playerEpisodeDockVisible : ""}`}
                      >
                        <ControlShell tooltip="Episodes (E)">
                          <button
                            ref={episodeButtonRef}
                            type="button"
                            className={`${styles.playerControlButton} ${styles.playerEpisodeButton}`}
                            onClick={toggleEpisodePanel}
                            aria-label={`选集 ${episodeButtonLabel} (E)`}
                            aria-expanded={showEpisodePanel}
                            aria-controls="player-episode-panel"
                          >
                            <EpisodeListIcon />
                            <span className={styles.playerEpisodeLabel}>{episodeButtonLabel}</span>
                          </button>
                        </ControlShell>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={volumeDockClassName}
                  onMouseEnter={() => {
                    setIsVolumeExpanded(true);
                    revealControls();
                  }}
                  onMouseLeave={() => setIsVolumeExpanded(false)}
                  onFocusCapture={() => {
                    setIsVolumeExpanded(true);
                    revealControls();
                  }}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setIsVolumeExpanded(false);
                    }
                  }}
                >
                  <ControlShell tooltip={volumeTooltip}>
                    <button
                      type="button"
                      className={`${styles.playerControlButton} ${styles.playerVolumeButton}`}
                      onClick={toggleMute}
                      aria-label={isMuted ? "取消静音 (M)" : "静音或取消静音 (M)"}
                    >
                      <VolumeIcon muted={isMuted} volume={volume} />
                    </button>
                  </ControlShell>

                  <div
                    className={styles.playerVolumePanel}
                    role="group"
                    aria-label="音量"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <label htmlFor={volumeSliderId} className={styles.srOnly}>
                      音量
                    </label>
                    <input
                      id={volumeSliderId}
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      className={styles.playerVolumeSlider}
                      style={volumeSliderStyle}
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) => updateVolume(Number(event.currentTarget.value))}
                    />
                  </div>
                </div>

                <span className={styles.playerTime}>
                  {currentTimeLabel} / {durationLabel}
                </span>
                </div>

                <div className={styles.playerSecondaryCluster}>
                  {!nextEpisodeHref && episodes.length > 0 ? (
                    <div className={styles.playerEpisodeDock}>
                      <ControlShell tooltip="Episodes (E)">
                        <button
                          ref={episodeButtonRef}
                          type="button"
                          className={`${styles.playerControlButton} ${styles.playerEpisodeButton}`}
                          onClick={toggleEpisodePanel}
                          aria-label={`选集 ${episodeButtonLabel} (E)`}
                          aria-expanded={showEpisodePanel}
                          aria-controls="player-episode-panel"
                        >
                          <EpisodeListIcon />
                          <span className={styles.playerEpisodeLabel}>{episodeButtonLabel}</span>
                        </button>
                      </ControlShell>
                    </div>
                  ) : null}

                  <div className={styles.playerSpeedDock}>
                  <ControlShell tooltip="Speed (S)">
                    <button
                      ref={speedButtonRef}
                      type="button"
                      className={`${styles.playerControlButton} ${styles.playerRateButton}`}
                      onClick={() => {
                        revealControls();
                        closeEpisodePanel();
                        setShowSpeedPanel((value) => !value);
                      }}
                      aria-label="倍速设置 (S)"
                    >
                      <SpeedIcon />
                      <span className={styles.playerRateLabel}>{speedButtonLabel}</span>
                    </button>
                  </ControlShell>
                  </div>

                  <ControlShell tooltip="Theater Mode (T)">
                    <button
                      type="button"
                      className={styles.playerControlButton}
                      onClick={toggleTheaterMode}
                      aria-label="影院模式 (T)"
                    >
                      <TheaterIcon active={isTheaterMode} />
                    </button>
                  </ControlShell>

                  <ControlShell tooltip="Fullscreen (F)">
                    <button
                      type="button"
                      className={styles.playerControlButton}
                      onClick={() => void toggleFullscreen()}
                      aria-label="全屏切换 (F)"
                    >
                      <FullscreenIcon active={isFullscreen} />
                    </button>
                  </ControlShell>
                </div>
                </div>
              </div>
            </div>

            {showSpeedPanel ? (
              <div
                ref={speedPanelRef}
                className={`${styles.playerSpeedPanel} ${styles.playerPanelVisible}`}
                role="group"
                aria-label="倍速控制"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <p className={styles.playerSpeedValue}>{playbackRate.toFixed(2)}x</p>
                <div className={styles.playerSpeedSliderRow}>
                  <button
                    type="button"
                    className={styles.playerRateStep}
                    onClick={() => updatePlaybackRate(playbackRate - SPEED_STEP)}
                    aria-label="降低倍速 ([)"
                  >
                    -
                  </button>

                  <label htmlFor={rateSliderId} className={styles.srOnly}>
                    自定义倍速
                  </label>
                  <input
                    id={rateSliderId}
                    type="range"
                    min={0.25}
                    max={2}
                    step={0.05}
                    value={playbackRate}
                    className={styles.playerSpeedSlider}
                    style={speedSliderStyle}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => updatePlaybackRate(Number(event.currentTarget.value))}
                  />

                  <button
                    type="button"
                    className={styles.playerRateStep}
                    onClick={() => updatePlaybackRate(playbackRate + SPEED_STEP)}
                    aria-label="提高倍速 (])"
                  >
                    +
                  </button>
                </div>

                <div className={styles.playerSpeedPresets}>
                  {SPEED_PRESETS.map((value, index) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.playerPresetButton} ${
                        Math.abs(playbackRate - value) < 0.001 ? styles.playerPresetButtonActive : ""
                      }`}
                      onClick={() => updatePlaybackRate(value)}
                      aria-label={`切换到 ${value}x (${index + 1})`}
                    >
                      {value.toFixed(value === 1 ? 1 : 2).replace(".00", "")}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showEpisodePanel && episodes.length > 0 ? (
              <div
                ref={episodePanelRef}
                id="player-episode-panel"
                className={`${styles.playerEpisodePanel} ${styles.playerPanelVisible}`}
                role="dialog"
                aria-label="选集列表"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className={styles.playerEpisodePanelHeader}>
                  <p className={styles.playerEpisodePanelTitle}>选集</p>
                  <span className={styles.playerEpisodePanelHint}>方向键切换，Enter 进入</span>
                </div>

                <div ref={episodeListRef} className={styles.playerEpisodeList} role="listbox" aria-activedescendant={focusedEpisodeIndex >= 0 ? `episode-option-${focusedEpisodeIndex}` : undefined}>
                  {episodes.map((episode, index) => {
                    const tooltip = episode.title || `第 ${episode.episodeNumber} 集`;
                    const isFocused = index === focusedEpisodeIndex;
                    return (
                      <button
                        key={episode.id}
                        ref={(node) => {
                          episodeItemRefs.current[index] = node;
                        }}
                        id={`episode-option-${index}`}
                        type="button"
                        className={`${styles.playerEpisodeOption} ${episode.isActive ? styles.playerEpisodeOptionActive : ""} ${
                          isFocused ? styles.playerEpisodeOptionFocused : ""
                        }`}
                        title={tooltip}
                        aria-label={tooltip}
                        aria-selected={episode.isActive}
                        onMouseEnter={() => setFocusedEpisodeIndex(index)}
                        onFocus={() => setFocusedEpisodeIndex(index)}
                        onClick={() => navigateToEpisode(episode.href, true)}
                      >
                        <span className={styles.playerEpisodeOptionNumber}>{episode.episodeNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

          {playbackError ? <div className={styles.playerErrorBanner}>{playbackError}</div> : null}
        </div>
      </div>

      <div className={styles.playerStatusRow}>
        <div className={styles.playerStatusLeft}>
          <span>点击视频区域或 K/空格 播放暂停</span>
          <span>←/→ 快退快进 5s</span>
          <span>↑/↓ 音量 ±5%</span>
        </div>

        <div className={styles.playerStatusRight}>
          {statusLabel ? <span>{statusLabel}</span> : null}
          <span>{availableSources.length > 0 ? `${availableSources.length} 个可切换播放源` : "演示播放源"}</span>
        </div>
      </div>
    </>
  );
}
