import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { getAdByRotation } from "@shared/adConfig";

type AdPlacement = "horizontal" | "lateral" | "middle";

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
  fallbackIndex?: number; // index for static fallback from adConfig
}

/**
 * AdBanner — Dynamic ad banner with rotation support.
 * - Fetches ads from DB for the given placement
 * - Rotates between ads using each ad's configured duration
 * - Renders Google AdSense code (dangerouslySetInnerHTML) for 'google' type ads
 * - Falls back to static adConfig banners if no DB ads are available
 * - No rotation indicators (dots/numbers) shown to the user
 */
export function AdBanner({ placement, className = "", fallbackIndex = 0 }: AdBannerProps) {
  const { data: allAds } = trpc.ads.list.useQuery({ placement });
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeAds = (allAds || []).filter((ad: any) => ad.isActive);

  // Rotate ads based on each ad's duration
  useEffect(() => {
    if (activeAds.length <= 1) return;

    const currentAd = activeAds[currentIndex];
    const duration = currentAd?.duration || 5000;

    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % activeAds.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, activeAds.length]);

  // Reset index when ads change
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeAds.length]);

  // Fallback to static config if no DB ads
  if (!activeAds || activeAds.length === 0) {
    const fallbackCategory = placement === "lateral" ? "sidebar" : "horizontal";
    const fallbackAd = getAdByRotation(fallbackCategory as any, fallbackIndex);
    if (!fallbackAd) return null;

    return (
      <div className={`flex justify-center items-center ${className}`}>
        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Publicidade">
          <img
            src={fallbackAd.url}
            alt={fallbackAd.alt}
            width={fallbackAd.width}
            height={fallbackAd.height}
            className="max-w-full h-auto"
          />
        </a>
      </div>
    );
  }

  const currentAd = activeAds[currentIndex % activeAds.length];
  if (!currentAd) return null;

  // Google AdSense ad
  if (currentAd.type === "google" && currentAd.adCode) {
    return (
      <div
        className={`flex justify-center items-center overflow-hidden ${className}`}
        dangerouslySetInnerHTML={{ __html: currentAd.adCode }}
      />
    );
  }

  // Custom image/GIF banner
  if (currentAd.imageUrl) {
    const dimensions = placement === "lateral"
      ? { width: 300, height: 250 }
      : { width: 728, height: 90 };

    return (
      <div className={`flex justify-center items-center ${className}`}>
        <a
          href={currentAd.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={currentAd.sponsor || "Publicidade"}
        >
          <img
            src={currentAd.imageUrl}
            alt={currentAd.sponsor || "Publicidade"}
            width={dimensions.width}
            height={dimensions.height}
            className="max-w-full h-auto"
          />
        </a>
      </div>
    );
  }

  return null;
}

export default AdBanner;
