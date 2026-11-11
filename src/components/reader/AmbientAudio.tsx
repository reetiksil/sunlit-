"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Wind,
  Music,
  Play,
  Pause,
  Swords,
  Sparkles,
  Compass,
  HeartCrack,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useReaderStore } from "@/stores/useReaderStore";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  setVolume: (volume: number) => void;
  loadVideoById: (videoId: string) => void;
  getPlayerState: () => number;
  destroy?: () => void;
}

export type AmbientSoundId =
  | "none"
  | "gentle-rain"
  | "heavy-rain"
  | "hearth"
  | "wind"
  | "happy-filaments"
  | "battle-goliath"
  | "sad-solace"
  | "mystery-dark-places"
  | "custom-youtube";

export type AmbientSoundCategory = "all" | "nature" | "music";

export interface SoundTrack {
  id: AmbientSoundId;
  label: string;
  category: "nature" | "music";
  file?: string;
  youtubeId?: string;
  artist?: string;
  youtubeUrl?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const SOUND_TRACKS: SoundTrack[] = [
  // 1. Natural High-Fidelity Audio Recordings
  {
    id: "gentle-rain",
    label: "Gentle Rain",
    category: "nature",
    file: "/sounds/forest-rain.ogg",
    icon: CloudRain,
    description: "Gentle raindrops through forest trees",
  },
  {
    id: "heavy-rain",
    label: "Heavy Rain",
    category: "nature",
    file: "/sounds/heavy-rain.ogg",
    icon: CloudRain,
    description: "Immersive, deep ambient rainfall",
  },
  {
    id: "hearth",
    label: "Hearth & Fire",
    category: "nature",
    file: "/sounds/fireplace.ogg",
    icon: Flame,
    description: "Crackling log fire with warm embers",
  },
  {
    id: "wind",
    label: "Mountain Wind",
    category: "nature",
    file: "/sounds/wind.ogg",
    icon: Wind,
    description: "Natural peaceful breeze across open fields",
  },
  // 2. Pure Instrumental Orchestral & Cinematic Mood Music
  {
    id: "happy-filaments",
    label: "Uplifting & Serene",
    category: "music",
    youtubeId: "lR2lMI5Wn-A",
    artist: "Scott Buckley · Instrumental",
    youtubeUrl: "https://www.youtube.com/watch?v=lR2lMI5Wn-A",
    icon: Sparkles,
    description: "Warm strings & gentle piano instrumental",
  },
  {
    id: "battle-goliath",
    label: "Battle & Epic",
    category: "music",
    youtubeId: "qYTJ8hDj_Hc",
    artist: "Scott Buckley · Instrumental",
    youtubeUrl: "https://www.youtube.com/watch?v=qYTJ8hDj_Hc",
    icon: Swords,
    description: "Dramatic orchestral drums & heroic brass",
  },
  {
    id: "sad-solace",
    label: "Sad & Melancholy",
    category: "music",
    youtubeId: "nTtln5hekqw",
    artist: "Scott Buckley · Instrumental",
    youtubeUrl: "https://www.youtube.com/watch?v=nTtln5hekqw",
    icon: HeartCrack,
    description: "Poignant solo piano & reflective strings",
  },
  {
    id: "mystery-dark-places",
    label: "Mystery & Suspense",
    category: "music",
    youtubeId: "hrn0RA_y2LM",
    artist: "Scott Buckley · Instrumental",
    youtubeUrl: "https://www.youtube.com/watch?v=hrn0RA_y2LM",
    icon: Compass,
    description: "Atmospheric orchestral intrigue & quiet tension",
  },
];

function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function AmbientAudio() {
  const [activeSound, setActiveSound] = useState<AmbientSoundId>("none");
  const [selectedCategory, setSelectedCategory] = useState<AmbientSoundCategory>("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isOpen, setIsOpen] = useState(false);
  const [customYtInput, setCustomYtInput] = useState("");
  const [customYtId, setCustomYtId] = useState<string | null>(null);
  const [ytReady, setYtReady] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const readerMode = useReaderStore((s) => s.settings.readerMode);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const pendingYtIdRef = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Close sound dropdown menu if open when entering reading mode
  useEffect(() => {
    if (readerMode) {
      setIsOpen(false);
    }
  }, [readerMode]);

  // Restore saved volume preference on mount
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem("sunlit_ambient_volume");
      if (savedVol) {
        const val = parseFloat(savedVol);
        if (!isNaN(val) && val >= 0 && val <= 1) {
          setVolume(val);
        }
      }
    } catch {}
  }, []);

  // Save volume preference
  useEffect(() => {
    try {
      localStorage.setItem("sunlit_ambient_volume", volume.toString());
    } catch {}
  }, [volume]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      setYtReady(true);
      return;
    }

    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      setYtReady(true);
    };

    if (!document.getElementById("yt-iframe-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Sync volume with active audio & YouTube player
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(volume * 100));
      } catch {}
    }
  }, [volume]);

  // Clean up audio & YouTube player on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.stopVideo();
          ytPlayerRef.current.destroy?.();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, []);

  const initYtPlayer = useCallback((videoId: string) => {
    setYtError(null);
    if (!window.YT || !window.YT.Player) {
      // Queue playback until the YouTube IFrame API finishes loading
      pendingYtIdRef.current = videoId;
      return;
    }

    pendingYtIdRef.current = null;

    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.setVolume(Math.round(volumeRef.current * 100));
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        setYtError("Unable to switch YouTube track. Please try again.");
        setIsPlaying(false);
      }
      return;
    }

    ytPlayerRef.current = new window.YT.Player("sunlit-yt-player-iframe", {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 1,
        loop: 1,
        playlist: videoId,
        modestbranding: 1,
        rel: 0,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      },
      events: {
        onReady: (event) => {
          try {
            event.target.setVolume(Math.round(volumeRef.current * 100));
            event.target.playVideo();
            setIsPlaying(true);
            setYtError(null);
          } catch {}
        },
        onStateChange: (event) => {
          if (event.data === window.YT?.PlayerState.PLAYING) {
            setIsPlaying(true);
            setYtError(null);
          } else if (event.data === window.YT?.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === window.YT?.PlayerState.ENDED) {
            try {
              ytPlayerRef.current?.playVideo();
            } catch {}
          }
        },
        onError: (event) => {
          setIsPlaying(false);
          if (event.data === 101 || event.data === 150) {
            setYtError("Embedding is disabled for this video by its uploader. Try another music link.");
          } else {
            setYtError("Could not play this track. Please verify the YouTube link or try another track.");
          }
        },
      },
    });
  }, []);

  // Flush queued track if the user clicked before YouTube API loaded
  useEffect(() => {
    if (ytReady && pendingYtIdRef.current) {
      const queuedId = pendingYtIdRef.current;
      pendingYtIdRef.current = null;
      initYtPlayer(queuedId);
    }
  }, [ytReady, initYtPlayer]);

  const selectSound = (soundId: AmbientSoundId, overrideYtId?: string) => {
    setYtError(null);

    if (soundId === "none") {
      pendingYtIdRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.stopVideo();
        } catch {}
      }
      setActiveSound("none");
      setIsPlaying(false);
      return;
    }

    // Custom YouTube link track
    if (soundId === "custom-youtube" && overrideYtId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveSound("custom-youtube");
      setCustomYtId(overrideYtId);
      initYtPlayer(overrideYtId);
      return;
    }

    const track = SOUND_TRACKS.find((t) => t.id === soundId);
    if (!track) return;

    if (activeSound === soundId) {
      if (isPlaying) {
        if (track.category === "music") {
          ytPlayerRef.current?.pauseVideo();
        } else {
          audioRef.current?.pause();
        }
        setIsPlaying(false);
      } else {
        if (track.category === "music" && track.youtubeId) {
          if (ytPlayerRef.current) {
            ytPlayerRef.current.playVideo();
          } else {
            initYtPlayer(track.youtubeId);
          }
          setIsPlaying(true);
        } else {
          audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
      return;
    }

    // Switching to another track
    if (track.category === "music" && track.youtubeId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveSound(soundId);
      initYtPlayer(track.youtubeId);
    } else if (track.file) {
      pendingYtIdRef.current = null;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.stopVideo();
        } catch {}
      }

      if (!audioRef.current) {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = "auto";
        audioRef.current = audio;
      }

      const audio = audioRef.current;
      audio.pause();
      audio.src = track.file;
      audio.volume = volume;
      audio.currentTime = 0;

      audio
        .play()
        .then(() => {
          setActiveSound(soundId);
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Audio playback error:", err);
          setActiveSound(soundId);
          setIsPlaying(false);
        });
    }
  };

  const togglePlayback = () => {
    if (activeSound === "none") {
      selectSound("happy-filaments");
      return;
    }

    if (activeSound === "custom-youtube" && customYtId) {
      if (isPlaying) {
        ytPlayerRef.current?.pauseVideo();
        setIsPlaying(false);
      } else {
        if (ytPlayerRef.current) {
          ytPlayerRef.current.playVideo();
        } else {
          initYtPlayer(customYtId);
        }
        setIsPlaying(true);
      }
      return;
    }

    const track = SOUND_TRACKS.find((t) => t.id === activeSound);
    if (!track) return;

    if (isPlaying) {
      if (track.category === "music") {
        ytPlayerRef.current?.pauseVideo();
      } else {
        audioRef.current?.pause();
      }
      setIsPlaying(false);
    } else {
      if (track.category === "music" && track.youtubeId) {
        if (ytPlayerRef.current) {
          ytPlayerRef.current.playVideo();
        } else {
          initYtPlayer(track.youtubeId);
        }
        setIsPlaying(true);
      } else {
        audioRef.current
          ?.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  };

  const handleAddCustomYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(customYtInput);
    if (id) {
      selectSound("custom-youtube", id);
      setCustomYtInput("");
    }
  };

  const currentTrack =
    activeSound === "custom-youtube"
      ? {
          id: "custom-youtube" as AmbientSoundId,
          label: "Custom YouTube Music",
          category: "music" as const,
          artist: "Custom Audio Stream",
          youtubeId: customYtId ?? undefined,
          youtubeUrl: customYtId ? `https://youtu.be/${customYtId}` : undefined,
          icon: Music,
          description: "Streamed via YouTube",
        }
      : SOUND_TRACKS.find((t) => t.id === activeSound);

  const filteredTracks =
    selectedCategory === "all"
      ? SOUND_TRACKS
      : SOUND_TRACKS.filter((t) => t.category === selectedCategory);

  return (
    <div className="relative inline-block text-left" ref={panelRef}>
      {/* Persistent YouTube player container anchored invisibly inside viewport so Chromium/Edge never throttles playback */}
      <div
        id="sunlit-yt-player-container"
        className="fixed bottom-1 right-1 h-28 w-48 pointer-events-none opacity-[0.01] -z-10"
        aria-hidden="true"
      >
        <div id="sunlit-yt-player-iframe" className="h-full w-full" />
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-reader btn-sm inline-flex items-center gap-1.5 transition-all ${
          isPlaying
            ? "text-primary border-primary/60 bg-primary/10 shadow-sm"
            : activeSound !== "none"
            ? "text-primary/80 border-primary/30"
            : ""
        }`}
        title="Ambient Reading Audio & Instrumental Music"
        aria-label="Ambient reading audio and instrumental music"
        aria-expanded={isOpen}
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4 text-primary animate-pulse" />
        ) : (
          <VolumeX className="h-4 w-4 opacity-75" />
        )}
        <span className="hidden sm:inline text-xs font-semibold">
          {isPlaying && currentTrack ? currentTrack.label : "Ambience"}
        </span>
      </button>

      {isOpen && (
        <div className="card fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 z-50 sm:w-88 max-w-[calc(100vw-2rem)] p-4 border border-border shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 bg-surface text-text rounded-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-serif text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-primary" /> Ambient Audio & Mood Music
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-text-muted hover:text-text p-1 rounded-md"
              aria-label="Close sound panel"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-text-muted leading-tight">
            High-fidelity natural atmospheres and purely instrumental mood music tailored to accompany your reading.
          </p>

          {/* Category filter pills */}
          <div className="flex rounded-xl bg-surface-soft/60 p-1 border border-border/70 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "nature", label: "Nature" },
                { id: "music", label: "Mood Music" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 py-1 rounded-lg font-medium text-[11px] transition-all ${
                  selectedCategory === cat.id
                    ? "bg-surface text-text font-bold shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sound selection list */}
          <div className="space-y-1.5">
            {filteredTracks.map((track) => {
              const isSelected = activeSound === track.id;
              const isCurrentlyPlaying = isSelected && isPlaying;
              const Icon = track.icon;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => selectSound(track.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-primary text-primary-fg font-semibold shadow-xs ring-1 ring-primary/30"
                      : "bg-surface-soft/60 hover:bg-surface-soft text-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-surface text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium leading-none truncate">{track.label}</p>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : track.category === "music"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              : "bg-accent-mint/20 text-accent-mint-fg"
                          }`}
                        >
                          {track.category === "music" ? "Music" : "Nature"}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] leading-tight truncate mt-0.5 ${
                          isSelected ? "text-primary-fg/80" : "text-text-muted"
                        }`}
                      >
                        {track.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    {isCurrentlyPlaying ? (
                      <Pause className="h-3.5 w-3.5 opacity-90" />
                    ) : isSelected ? (
                      <Play className="h-3.5 w-3.5 opacity-90" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add custom YouTube music link */}
          <form onSubmit={handleAddCustomYoutube} className="pt-1">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Paste any YouTube music link or ID..."
                value={customYtInput}
                onChange={(e) => setCustomYtInput(e.target.value)}
                className="input input-sm text-xs flex-1 rounded-xl bg-surface-soft/80 border-border text-text placeholder:text-text-muted/60"
              />
              <button
                type="submit"
                disabled={!extractYouTubeId(customYtInput)}
                className="btn btn-sm btn-primary rounded-xl px-2.5 text-xs inline-flex items-center gap-1 disabled:opacity-40"
                title="Play YouTube track"
              >
                <Plus className="h-3.5 w-3.5" /> Play
              </button>
            </div>
          </form>

          {ytError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-600 dark:text-red-400">
              {ytError}
            </p>
          )}

          {/* Currently playing track details */}
          {activeSound !== "none" && currentTrack && (
            <div className="rounded-xl border border-border/70 bg-surface-soft/70 p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-text truncate max-w-[180px]">
                  {currentTrack.label}
                </span>
                {currentTrack.youtubeUrl && (
                  <a
                    href={currentTrack.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    YouTube <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              {currentTrack.artist && (
                <p className="text-[10px] text-text-muted truncate">{currentTrack.artist}</p>
              )}
            </div>
          )}

          {/* Master volume & playback controls when sound is active */}
          {activeSound !== "none" && (
            <div className="pt-2 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="btn btn-sm btn-outline inline-flex items-center gap-1.5 text-xs py-1 px-3"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Resume
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => selectSound("none")}
                  className="text-xs text-text-muted hover:text-red-500 font-medium inline-flex items-center gap-1"
                >
                  <VolumeX className="h-3.5 w-3.5" /> Stop / Mute
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Audio Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Volume slider"
                  className="w-full accent-primary h-1.5 bg-surface-soft rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
