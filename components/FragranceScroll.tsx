"use client";

import { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ── Asset Config ─────────────────────────────────────────── */
const TOTAL_FRAMES = 240;
const STORY_POINTS = [0, 0.25, 0.6, 0.9];

function getFrameSrc(index: number): string {
    const num = String(index + 1).padStart(3, "0");
    return `/hero/ezgif-frame-${num}.jpg`;
}

const storyBeats = [
    { start: 0.0, end: 0.2, heading: "AURA Luxe.", sub: "The Essence of Presence." },
    { start: 0.23, end: 0.45, heading: "Crafted in Grasse.", sub: "Pure emerald glass, hand-finished." },
    { start: 0.55, end: 0.75, heading: "The Anatomy of Scent.", sub: "Precision-engineered atomization." },
    { start: 0.85, end: 1.0, heading: "Your Signature.", sub: "Experience the Unseen.", cta: true },
];

/* ── Error Boundary Fallback ────────────────────────────────── */
function StaticHeroFallback() {
    return (
        <div className="relative h-screen w-full bg-[#121212] flex items-center justify-center">
            <div className="text-center z-10 px-6">
                <h1 className="text-[#D4AF37] text-5xl md:text-7xl font-serif font-bold tracking-wide mb-6">
                    LPS Perfume
                </h1>
                <p className="text-white/60 text-xl font-sans font-light max-w-xl mx-auto mb-10">
                    Premium B2B Wholesale fragrances for distributors.
                </p>
                <Link
                    href="/catalog"
                    className="px-8 py-3 bg-[#D4AF37] text-white rounded-full text-sm uppercase tracking-widest hover:bg-[#B8860B] transition-all"
                >
                    Explore Shop
                </Link>
            </div>
            {/* Ambient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black opacity-60" />
        </div>
    );
}

/* ── Main Component ────────────────────────────────────────── */
export default function FragranceScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [loadProgress, setLoadProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    /* ── Preload images ────────────────────────────────────── */
    useEffect(() => {
        const imgs: HTMLImageElement[] = [];
        let loaded = 0;
        let failed = 0;

        const handleLoad = () => {
            loaded++;
            setLoadProgress(Math.round(((loaded + failed) / TOTAL_FRAMES) * 100));
            if (loaded + failed === TOTAL_FRAMES) {
                if (loaded > 0) setIsLoaded(true);
                else setHasError(true);
            }
        };

        const handleError = (e: any) => {
            console.error("Frame failed to load", e);
            failed++;
            setLoadProgress(Math.round(((loaded + failed) / TOTAL_FRAMES) * 100));
            if (loaded + failed === TOTAL_FRAMES) {
                if (loaded > 0) setIsLoaded(true);
                else setHasError(true);
            }
        };

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFrameSrc(i);
            img.onload = handleLoad;
            img.onerror = handleError;
            imgs.push(img);
        }
        imagesRef.current = imgs;
    }, []);

    /* ── Render frame to canvas ────────────────────────────── */
    const renderFrame = useCallback(
        (idx: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const roundedIdx = Math.round(idx);
            const img = imagesRef.current[roundedIdx];

            // Fallback to nearest loaded frame if current is missing
            if (!img || !img.complete) {
                // Find nearest frame if we have gaps
                return;
            }

            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        },
        []
    );

    useEffect(() => {
        if (!isLoaded || hasError) return;

        // Initial render
        renderFrame(0);

        const unsub = frameIndex.on("change", (val) => {
            requestAnimationFrame(() => renderFrame(val));
        });

        return () => unsub();
    }, [isLoaded, hasError, frameIndex, renderFrame]);

    /* ── Opacity helpers mapped to Story Points ─────────────── */
    const opacity0 = useTransform(scrollYProgress, [storyBeats[0].start, storyBeats[0].start + 0.05, storyBeats[0].end - 0.05, storyBeats[0].end], [0, 1, 1, 0]);
    const opacity1 = useTransform(scrollYProgress, [storyBeats[1].start, storyBeats[1].start + 0.05, storyBeats[1].end - 0.05, storyBeats[1].end], [0, 1, 1, 0]);
    const opacity2 = useTransform(scrollYProgress, [storyBeats[2].start, storyBeats[2].start + 0.05, storyBeats[2].end - 0.05, storyBeats[2].end], [0, 1, 1, 0]);
    const opacity3 = useTransform(scrollYProgress, [storyBeats[3].start, storyBeats[3].start + 0.05, storyBeats[3].end - 0.05, storyBeats[3].end], [0, 1, 1, 0]);

    const textOpacities = [opacity0, opacity1, opacity2, opacity3];
    const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

    if (hasError) return <StaticHeroFallback />;

    return (
        <div ref={containerRef} className="relative h-[500vh] hero-section">
            {/* Sticky viewport */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
                {/* Loading screen */}
                {!isLoaded && (
                    <div className="absolute inset-0 z-30 bg-[#121212] flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -inset-4 bg-primary/20 blur-xl rounded-full"
                            />
                            <p className="relative text-[#D4AF37] font-serif text-2xl tracking-[0.4em] uppercase">
                                LPS PERFUME
                            </p>
                        </div>
                        <div className="w-72 h-[1px] bg-white/10 relative overflow-hidden">
                            <motion.div
                                className="h-full bg-[#D4AF37]"
                                animate={{ width: `${loadProgress}%` }}
                                transition={{ type: "spring", stiffness: 50 }}
                            />
                        </div>
                        <p className="text-white/30 text-[10px] tracking-widest font-sans uppercase">
                            Crafting Scent {loadProgress}%
                        </p>
                    </div>
                )}

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{
                        display: isLoaded ? "block" : "none",
                        opacity: isLoaded ? 1 : 0,
                        transition: "opacity 1.5s ease"
                    }}
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

                {/* Story overlays */}
                {isLoaded &&
                    storyBeats.map((beat, i) => (
                        <motion.div
                            key={i}
                            style={{ opacity: textOpacities[i] }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
                        >
                            <h2 className="text-[#D4AF37] text-4xl sm:text-5xl md:text-8xl font-serif font-bold tracking-tight mb-4 drop-shadow-2xl">
                                {beat.heading}
                            </h2>
                            <p className="text-white/80 text-lg sm:text-xl md:text-2xl font-sans font-extralight max-w-xl tracking-wider uppercase">
                                {beat.sub}
                            </p>
                            {beat.cta && (
                                <Link
                                    href="/catalog"
                                    className="pointer-events-auto mt-12 px-10 py-4 bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-xs uppercase tracking-[0.3em] font-medium hover:bg-[#D4AF37] hover:text-white transition-all duration-500 backdrop-blur-sm"
                                >
                                    Experience Now
                                </Link>
                            )}
                        </motion.div>
                    ))}

                {/* Scroll indicator */}
                {isLoaded && (
                    <motion.div
                        style={{ opacity: scrollIndicatorOpacity }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                    >
                        <div className="w-[1px] h-16 bg-gradient-to-b from-[#D4AF37] to-transparent relative overflow-hidden">
                            <motion.div
                                animate={{ y: [0, 64] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"
                            />
                        </div>
                        <span className="text-white/20 text-[9px] tracking-[0.5em] uppercase font-sans">
                            Scroll Down
                        </span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
