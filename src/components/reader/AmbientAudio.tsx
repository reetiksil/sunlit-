"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, CloudRain, Flame, Wind, Music, Play, Pause } from "lucide-react";

export type AmbientSoundId = "none" | "gentle-rain" | "heavy-rain" | "hearth" | "wind";

interface SoundTrack {
  id: AmbientSoundId;
  label: string;
  file: string;
  icon: typeof CloudRain;
  description: string;
}

const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "gentle-rain",
    label: "Gentle Rain",
    file: "/sounds/forest-rain.ogg",
    icon: CloudRain,
    description: "Gentle raindrops through forest trees",
  },
  {
    id: "heavy-rain",
    label: "Heavy Rain",
    file: "/sounds/heavy-rain.ogg",
    icon: CloudRain,
    description: "Immersive, deep ambient rainfall",
  },
  {
    id: "hearth",
    label: "Hearth",
    file: "/sounds/fireplace.ogg",
    icon: Flame,
    description: "Crackling log fire with warm embers",
  },
  {
    id: "wind",
    label: "Wind",
    file: "/sounds/wind.ogg",
    icon: Wind,
    description: "Natural peaceful mountain & field breeze",
  },
];

export function AmbientAudio() {
  const [activeSound, setActiveSound] = useState<AmbientSoundId>("none");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [isOpen, setIsOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

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

  // Sync volume with active audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
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

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const selectSound = (soundId: AmbientSoundId) => {
    if (soundId === "none") {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveSound("none");
      setIsPlaying(false);
      return;
    }

    if (activeSound === soundId) {
      // Toggle play/pause if clicking the same sound
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    const track = SOUND_TRACKS.find((t) => t.id === soundId);
    if (!track) return;

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
        console.warn("Audio autoplay prevented or error:", err);
        setActiveSound(soundId);
        setIsPlaying(false);
      });
  };

  const togglePlayback = () => {
    if (activeSound === "none") {
      selectSound("gentle-rain");
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const currentTrack = SOUND_TRACKS.find((t) => t.id === activeSound);

  return (
    <div className="relative inline-block text-left" ref={panelRef}>
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
        title="Ambient Reading Sounds (Rain, Hearth, Wind)"
        aria-label="Ambient sounds"
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
        <div className="card absolute right-0 top-11 z-50 w-72 p-4 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 bg-surface text-text rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-serif text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-primary" /> Ambient Soundscapes
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
            Immersive natural atmospheres recorded in high fidelity to accompany your reading.
          </p>

          {/* Sound selection list */}
          <div className="space-y-1.5">
            {SOUND_TRACKS.map((track) => {
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
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-surface text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-none mb-0.5">{track.label}</p>
                      <p
                        className={`text-[10px] leading-tight ${
                          isSelected ? "text-primary-fg/80" : "text-text-muted"
                        }`}
                      >
                        {track.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
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

          {/* Master controls when sound is active */}
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
                  <span>Ambience Volume</span>
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
