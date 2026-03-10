"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export default function Hero() {
    const t = useTranslations("home");
    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
            {/* Fallback for background video - using a luxury image for now */}
            <div
                className="absolute inset-0 z-0 opacity-60"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1978&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Golden lighting overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-black opacity-40" />
            <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

            <div className="container relative z-20 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="text-primary font-medium tracking-[0.3em] uppercase mb-4 block">
                        {t('lps')} {t('perfume')} Setif
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl text-white font-serif mb-6 leading-tight">
                        {t('hero.title_part1')} <br />
                        <span className="text-primary italic">{t('hero.title_part2')}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-gray-300 text-lg md:text-xl mb-10 font-light">
                        {t('hero.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg">{t('hero.browse_collections')}</Button>
                        <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
                            {t('hero.become_partner')}
                        </Button>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
            >
                <div className="w-px h-16 bg-gradient-to-b from-primary to-transparent" />
            </motion.div>
        </section>
    );
}
