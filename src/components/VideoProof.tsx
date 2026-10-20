import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { FOAM_STEPS_CLIP, GATES } from '../lib/assets';
import { productPath, findBySlug } from '../lib/catalog';

/**
 * Foam-steps demo. The caption is limited to the 9-second clip: a corgi
 * climbs the gray steps beside a bed, stands on top, steps down, then
 * moves on the bed. The gate stays after the hooks.
 */
export const VideoProof: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const product = findBySlug(FOAM_STEPS_CLIP.productSlug);
  const { pathname } = useLocation();
  const onThisProduct = product
    ? pathname === productPath(product) || pathname === `${productPath(product)}/`
    : false;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!started) {
      setStarted(true);
      video.play();
      setPlaying(true);
    } else if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play();
      setPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  if (!GATES.videoProof) return null;

  return (
    <section id="video" className="bg-stone-900 py-16 text-stone-100 scroll-mt-20 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Play className="h-3.5 w-3.5 fill-amber-400" /> See it work
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            A corgi on the foam steps
          </h2>
          <p className="mt-4 text-lg text-stone-400">{FOAM_STEPS_CLIP.caption}</p>
        </div>

        <div className="group relative overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-stone-800">
          <video
            ref={videoRef}
            className="aspect-square w-full object-contain"
            muted={muted}
            loop
            playsInline
            preload="metadata"
            poster={FOAM_STEPS_CLIP.poster}
            src={FOAM_STEPS_CLIP.src}
            onClick={togglePlay}
          >
            <track
              kind="captions"
              src={FOAM_STEPS_CLIP.captions}
              srcLang="en"
              label="English"
              default
            />
          </video>

          {!started && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/30"
              aria-label="Play the foam steps clip"
            >
              <span className="relative flex items-center justify-center">
                <span className="absolute h-24 w-24 animate-ping rounded-full bg-white/20" />
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl transition-transform group-hover:scale-110">
                  <Play className="ml-1 h-9 w-9 fill-stone-900 text-stone-900" />
                </span>
              </span>
            </button>
          )}

          {started && !playing && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
              aria-label="Resume video"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
                <Play className="ml-1 h-7 w-7 fill-stone-900 text-stone-900" />
              </span>
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div
              className="group/progress mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/25"
              onClick={handleProgressClick}
            >
              <div
                className="relative h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute right-0 top-1/2 h-3.5 w-3.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white transition-colors hover:text-amber-400" aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
                </button>
                <button onClick={toggleMute} className="text-white transition-colors hover:text-amber-400" aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <span className="text-xs font-medium text-white/70">Foam steps · {FOAM_STEPS_CLIP.durationLabel}</span>
              </div>
              <button onClick={toggleFullscreen} className="text-white transition-colors hover:text-amber-400" aria-label="Fullscreen">
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {product && !onThisProduct && (
          <p className="mt-6 text-center">
            <Link
              to={productPath(product)}
              className="inline-flex h-12 items-center rounded-full bg-white px-6 font-bold text-stone-900"
            >
              Shop the foam steps
            </Link>
          </p>
        )}
      </div>
    </section>
  );
};
