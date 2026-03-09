"use client";

import Hls from "hls.js";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { MediaEpisodeOption, MediaItem, PlaybackSourceOption } from "../../types/media";
import styles from "../detail/detail-page.module.css";

const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 0.05;
const SPEED_STEP = 0.05;
const SPEED_PRESETS = [1, 1.25, 1.5, 2];
const MEDIA_PROGRESS_EVENT = "media-progress-updated";

type StoredPlaybackProgress = {
  currentTime: number;
  duration: number;
  updatedAt: number;
  completed: boolean;
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

function isHlsSource(source: PlaybackSourceOption | null) {
  if (!source) {
    return false;
  }

  return source.provider === "m3u8" || source.format.toLowerCase().includes("m3u8") || source.url.includes(".m3u8");
}

function buildProgressKey(mediaSlug: string, episodeSlug?: string, sourceId?: string) {
  return `media-progress:${mediaSlug}:${episodeSlug ?? "feature"}:${sourceId ?? "default"}`;
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

function ControlShell({
  tooltip,
  children,
}: {
  tooltip: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.playerControlShell}>
      {children}
      <span role="tooltip" className={styles.playerTooltip}>
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

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume <= 0.01) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
        <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
        <path d="m16 9.3 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
      <path
        d="M15.5 9.2a4.7 4.7 0 0 1 0 5.6M18 7.2a8 8 0 0 1 0 9.6"
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
  source,
  availableSources = [],
  activeEpisode,
  nextEpisodeHref,
  nextEpisodeLabel,
}: {
  media: MediaItem;
  source: PlaybackSourceOption | null;
  availableSources?: PlaybackSourceOption[];
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastPersistedTimeRef = useRef(0);
  const pendingResumeRef = useRef<StoredPlaybackProgress | null>(null);

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
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const progressKey = useMemo(
    () => buildProgressKey(media.slug, activeEpisode?.slug, source?.id),
    [activeEpisode?.slug, media.slug, source?.id],
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

  function emitProgress(progress: StoredPlaybackProgress) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(MEDIA_PROGRESS_EVENT, {
        detail: {
          mediaSlug: media.slug,
          episodeSlug: activeEpisode?.slug,
          sourceId: source?.id,
          progress,
        },
      }),
    );
  }

  function saveProgress(time: number, nextDuration: number, completed: boolean) {
    if (!progressKey || typeof window === "undefined") {
      return;
    }

    const normalizedTime = completed ? nextDuration : Math.max(0, time);
    const progress: StoredPlaybackProgress = {
      currentTime: normalizedTime,
      duration: nextDuration,
      updatedAt: Date.now(),
      completed,
    };

    persistStoredProgress(progressKey, progress);
    emitProgress(progress);
  }

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
    const video = videoRef.current;
    if (!video || !source?.url) {
      return undefined;
    }

    pendingResumeRef.current = readStoredProgress(progressKey);
    lastPersistedTimeRef.current = 0;
    setPlaybackError(null);
    setCurrentTime(0);
    setDuration(0);
    setBufferedUntil(0);
    setIsPlaying(false);

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

    const playAttempt = video.play();
    if (playAttempt) {
      void playAttempt.catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isMuted, playbackRate, progressKey, source?.id, source?.url, volume]);

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
      if (
        activeElement instanceof HTMLElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
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
          setShowSpeedPanel((value) => !value);
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
            closeSpeedPanel();
            router.push(nextEpisodeHref, { scroll: false });
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [nextEpisodeHref, playbackRate, router, volume]);

  async function togglePlayback() {
    closeSpeedPanel();
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
    closeSpeedPanel();
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

    closeSpeedPanel();
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function updateVolume(nextVolume: number) {
    closeSpeedPanel();
    const safeVolume = clamp(nextVolume, 0, 1);
    setVolume(safeVolume);
    setIsMuted(safeVolume <= 0.001);
    if (safeVolume > 0) {
      setPreviousVolume(safeVolume);
    }
  }

  function toggleMute() {
    closeSpeedPanel();
    if (isMuted || volume <= 0.001) {
      const restored = previousVolume > 0 ? previousVolume : 0.65;
      setIsMuted(false);
      setVolume(restored);
      return;
    }

    setPreviousVolume(volume);
    setIsMuted(true);
  }

  function updatePlaybackRate(nextRate: number) {
    setPlaybackRate(Number(clamp(nextRate, 0.25, 2).toFixed(2)));
  }

  function toggleTheaterMode() {
    closeSpeedPanel();
    setIsTheaterMode((value) => !value);
  }

  async function toggleFullscreen() {
    closeSpeedPanel();
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

  const wrapperClassName = [
    styles.playerViewportWrap,
    isTheaterMode ? styles.playerViewportWrapTheater : "",
    isFullscreen ? styles.playerViewportWrapFullscreen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const viewportClassName = [
    styles.playerViewport,
    isTheaterMode || isFullscreen ? styles.playerViewportImmersive : "",
  ]
    .filter(Boolean)
    .join(" ");

  const volumeSliderStyle = { "--fill": `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties;
  const speedSliderStyle = {
    "--fill": `${((playbackRate - 0.25) / 1.75) * 100}%`,
  } as CSSProperties;
  const volumeTooltip = isMuted ? "Unmute (M)" : "Volume (M / ↑ / ↓)";
  const playTooltip = isPlaying ? "Pause (K / Space)" : "Play (K / Space)";

  return (
    <>
      <div ref={playerRef} className={wrapperClassName}>
        <div className={viewportClassName}>
          {media.backdropUrl ? (
            <div className={styles.playerBackdrop} style={{ backgroundImage: `url(${media.backdropUrl})` }} aria-hidden="true" />
          ) : null}

          <video
            ref={videoRef}
            className={styles.playerVideo}
            playsInline
            preload="metadata"
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
                saved.currentTime > 5 &&
                nextDuration > 15 &&
                saved.currentTime < nextDuration - 10
              ) {
                video.currentTime = saved.currentTime;
                setCurrentTime(saved.currentTime);
              }
            }}
            onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              setCurrentTime(video.currentTime);
              if (Math.abs(video.currentTime - lastPersistedTimeRef.current) >= 5 && Number.isFinite(video.duration) && video.duration > 0) {
                lastPersistedTimeRef.current = video.currentTime;
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
                router.push(nextEpisodeHref, { scroll: false });
              }
            }}
          />

          <div className={styles.playerChrome}>
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
                <ControlShell tooltip={playTooltip}>
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
                  <ControlShell tooltip={`Next Episode (N)`}>
                    <button
                      type="button"
                      className={styles.playerControlButton}
                      onClick={() => {
                        closeSpeedPanel();
                        router.push(nextEpisodeHref, { scroll: false });
                      }}
                      aria-label={`下一集 ${nextEpisodeLabel ?? ""} (N)`}
                    >
                      <NextEpisodeIcon />
                    </button>
                  </ControlShell>
                ) : null}

                <div className={styles.playerVolumeDock}>
                  <ControlShell tooltip={volumeTooltip}>
                    <button
                      type="button"
                      className={styles.playerControlButton}
                      onClick={toggleMute}
                      aria-label={isMuted ? "取消静音 (M)" : "静音或取消静音 (M)"}
                    >
                      <VolumeIcon muted={isMuted} volume={volume} />
                    </button>
                  </ControlShell>

                  <div className={styles.playerVolumePanel} role="group" aria-label="音量">
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
                      onChange={(event) => updateVolume(Number(event.currentTarget.value))}
                    />
                  </div>
                </div>

                <span className={styles.playerTime}>
                  {currentTimeLabel} / {durationLabel}
                </span>
              </div>

              <div className={styles.playerSecondaryCluster}>
                <div className={styles.playerSpeedDock}>
                  <ControlShell tooltip="Speed (S)">
                    <button
                      ref={speedButtonRef}
                      type="button"
                      className={styles.playerControlButton}
                      onClick={() => setShowSpeedPanel((value) => !value)}
                      aria-label="倍速设置 (S)"
                    >
                      <SpeedIcon />
                    </button>
                  </ControlShell>

                  <div
                    ref={speedPanelRef}
                    className={`${styles.playerSpeedPanel} ${showSpeedPanel ? styles.playerPanelVisible : ""}`}
                    role="group"
                    aria-label="倍速控制"
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
