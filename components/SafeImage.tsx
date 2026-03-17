"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface SafeImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    priority?: boolean;
    sizes?: string;
}

const FALLBACK_IMAGE = "/images/placeholder-perfume.svg";

export default function SafeImage({
    src,
    alt,
    width,
    height,
    fill,
    className = "",
    priority = false,
    sizes,
}: SafeImageProps) {
    const [imageSrc, setImageSrc] = useState(src || FALLBACK_IMAGE);
    const [hasError, setHasError] = useState(false);

    // Update imageSrc when src prop changes
    useEffect(() => {
        setImageSrc(src || FALLBACK_IMAGE);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImageSrc(FALLBACK_IMAGE);
        }
    };

    if (fill) {
        return (
            <Image
                src={imageSrc}
                alt={alt}
                fill
                className={className}
                onError={handleError}
                loading={priority ? undefined : "lazy"}
                priority={priority}
                sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
            />
        );
    }

    return (
        <Image
            src={imageSrc}
            alt={alt}
            width={width || 400}
            height={height || 400}
            className={className}
            onError={handleError}
            loading={priority ? undefined : "lazy"}
            priority={priority}
            sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        />
    );
}
