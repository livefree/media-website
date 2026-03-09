"use client";

import Hls from "hls.js";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { MediaEpisodeOption, MediaItem, PlaybackSourceOption } from "../../types/media";
import styles from "../detail/detail-page.module.css";

const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 0.05;
const SPEED_STEP = 0.05;
const SPEED_PRESETS = [1, 1.25, 1.5, 2];

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

function Shortcut({ label }: { label: string }) {
  return <span className={styles.playerShortcut}>{label}</span>;
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
      <path d="M6 6.5v11l7.6-5.5L6 6.5Z" fill="currentColor" />
      <path d="M13 6.5v11l7-5.5-7-5.5Z" fill="currentColor" />
    </svg>
  );
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume <= 0.01) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
        <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
        <path d="m16.1 9.1 4.2 4.2M20.3 9.1l-4.2 4.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M9 8.2 12.6 5v14L9 15.8H6V8.2h3Z" fill="currentColor" />
      <path
        d="M15.6 9.2a4.8 4.8 0 0 1 0 5.6M18.1 7a8 8 0 0 1 0 10"
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
      <path d="m12.2 12.2 4.4-2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12.2" r="1.4" fill="currentColor" />
    </svg>
  );
}

function TheaterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <rect x="4.5" y="6" width="15" height="12" rx="1.8" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M9 10.2h6M9 13.8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M8.2 4.8H4.8v3.4M19.2 8.2V4.8h-3.4M15.8 19.2h3.4v-3.4M4.8 15.8v3.4h3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.playerIcon}>
      <path d="M8.2 4.8H4.8v3.4M15.8 4.8h3.4v3.4M19.2 15.8v3.4h-3.4M8.2 19.2H4.8v-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

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
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const currentTimeLabel = formatTime(currentTime);
  const durationLabel = formatTime(duration);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedUntil / duration) * 100 : 0;
  const statusLabel = useMemo(() => {
    const labels = [activeEpisode?.title, source?.providerLabel, source?.quality, media.status];
    return labels.filter(Boolean).join(" · ");
  }, [activeEpisode?.title, media.status, source?.providerLabel, source?.quality]);

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
    const video = videoRef.current;
    if (!video || !source?.url) {
      return undefined;
    }

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
  }, [source?.id, source?.url]);

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
          setIsTheaterMode((value) => !value);
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
            router.push(nextEpisodeHref);
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
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextTime = clamp(video.currentTime + delta, 0, Number.isFinite(video.duration) ? video.duration : video.currentTime + delta);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleSeek(nextTime: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function updateVolume(nextVolume: number) {
    const safeVolume = clamp(nextVolume, 0, 1);
    setVolume(safeVolume);
    setIsMuted(safeVolume <= 0.001);
    if (safeVolume > 0) {
      setPreviousVolume(safeVolume);
    }
  }

  function toggleMute() {
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

  async function toggleFullscreen() {
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

  const playerClassName = [
    styles.playerViewportWrap,
    isTheaterMode ? styles.playerViewportWrapTheater : "",
  ]
    .filter(Boolean)
    .join(" ");
  const volumeSliderStyle = { "--fill": `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties;
  const speedSliderStyle = {
    "--fill": `${((playbackRate - 0.25) / (2 - 0.25)) * 100}%`,
  } as CSSProperties;

  return (
    <>
      <div ref={playerRef} className={playerClassName}>
        <div className={styles.playerViewport}>
          {media.backdropUrl ? (
            <div className={styles.playerBackdrop} style={{ backgroundImage: `url(${media.backdropUrl})` }} aria-hidden="true" />
          ) : null}
          <video
            ref={videoRef}
            className={styles.playerVideo}
            playsInline
            preload="metadata"
            poster={media.posterUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onProgress={(event) => {
              const buffered = event.currentTarget.buffered;
              if (buffered.length > 0) {
                setBufferedUntil(buffered.end(buffered.length - 1));
              }
            }}
            onError={() => setPlaybackError("视频加载失败，请尝试切换播放源。")}
            onEnded={() => {
              setIsPlaying(false);
              if (nextEpisodeHref) {
                router.push(nextEpisodeHref);
              }
            }}
          />

          <div className={styles.playerBrand}>ddys.io</div>

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
                <button
                  type="button"
                  className={styles.playerControlButton}
                  onClick={() => void togglePlayback()}
                  aria-label={isPlaying ? "暂停 (K / Space)" : "播放 (K / Space)"}
                >
                  <PlayIcon paused={!isPlaying} />
                  <Shortcut label="K" />
                </button>

                {nextEpisodeHref ? (
                  <button
                    type="button"
                    className={styles.playerControlButton}
                    onClick={() => router.push(nextEpisodeHref)}
                    aria-label={`下一集 ${nextEpisodeLabel ?? ""} (N)`}
                  >
                    <NextEpisodeIcon />
                    <Shortcut label="N" />
                  </button>
                ) : null}

                <div className={styles.playerVolumeDock}>
                  <button
                    type="button"
                    className={styles.playerControlButton}
                    onClick={() => {
                      setShowVolumePanel((value) => !value);
                      setShowSpeedPanel(false);
                    }}
                    aria-label="静音或取消静音 (M)"
                  >
                    <VolumeIcon muted={isMuted} volume={volume} />
                    <Shortcut label="M" />
                  </button>

                  <div
                    className={`${styles.playerVolumePanel} ${showVolumePanel ? styles.playerPanelVisible : ""}`}
                    role="group"
                    aria-label="音量"
                  >
                    <button
                      type="button"
                      className={styles.playerVolumeToggle}
                      onClick={toggleMute}
                      aria-label={isMuted ? "取消静音 (M)" : "静音 (M)"}
                    >
                      <VolumeIcon muted={isMuted} volume={volume} />
                    </button>
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
                  <button
                    type="button"
                    className={styles.playerControlButton}
                    onClick={() => {
                      setShowSpeedPanel((value) => !value);
                      setShowVolumePanel(false);
                    }}
                    aria-label="倍速设置 (S)"
                  >
                    <SpeedIcon />
                    <Shortcut label="S" />
                  </button>

                  <div
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
                          <span>{value.toFixed(value === 1 ? 1 : 2).replace(".00", "")}</span>
                          <Shortcut label={String(index + 1)} />
                        </button>
                      ))}
                    </div>

                    <p className={styles.playerSpeedLegend}>滑杆支持 0.25x 至 2.00x，自定义快捷键为 [ / ]</p>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.playerControlButton}
                  onClick={() => setIsTheaterMode((value) => !value)}
                  aria-label="影院模式 (T)"
                >
                  <TheaterIcon />
                  <Shortcut label="T" />
                </button>

                <button
                  type="button"
                  className={styles.playerControlButton}
                  onClick={() => void toggleFullscreen()}
                  aria-label="全屏切换 (F)"
                >
                  <FullscreenIcon active={isFullscreen} />
                  <Shortcut label="F" />
                </button>
              </div>
            </div>
          </div>

          {playbackError ? <div className={styles.playerErrorBanner}>{playbackError}</div> : null}
        </div>
      </div>

      <div className={styles.playerStatusRow}>
        <div className={styles.playerStatusLeft}>
          <span>空格/K 播放暂停</span>
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
