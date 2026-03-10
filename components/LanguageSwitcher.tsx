"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher({ isHeroPage }: { isHeroPage: boolean }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const switchLanguage = (newLocale: string) => {
        startTransition(() => {
            // Replace the locale part of the pathname
            const segments = pathname.split('/');
            segments[1] = newLocale;
            const newPathname = segments.join('/');

            // Preserve search parameters
            const currentParams = searchParams.toString();
            const fullPath = currentParams ? `${newPathname}?${currentParams}` : newPathname;

            router.replace(fullPath);
        });
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => switchLanguage('fr')}
                disabled={isPending || locale === 'fr'}
                className={`text-xs font-bold px-2 py-1 rounded transition-all ${locale === 'fr'
                    ? isHeroPage ? "bg-[#D4AF37] text-black" : "bg-primary text-white"
                    : isHeroPage ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-primary"
                    }`}
            >
                FR
            </button>
            <span className={isHeroPage ? "text-white/30" : "text-gray-300"}>|</span>
            <button
                onClick={() => switchLanguage('ar')}
                disabled={isPending || locale === 'ar'}
                className={`text-xs font-bold px-2 py-1 rounded transition-all ${locale === 'ar'
                    ? isHeroPage ? "bg-[#D4AF37] text-black" : "bg-primary text-white"
                    : isHeroPage ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-primary"
                    }`}
            >
                AR
            </button>
        </div>
    );
}
