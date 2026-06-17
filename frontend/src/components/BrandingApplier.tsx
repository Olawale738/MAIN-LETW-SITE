'use client';

import { useEffect } from 'react';
import { siteBrandingApi, resolveBrandingUrl } from '@/lib/api';

const BRANDING_EVENT = 'letw:branding-updated';

declare global {
    interface Window {
        __letwBranding?: { logo_url: string | null; favicon_url: string | null };
    }
}

function setFavicon(url: string) {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('link[rel~="icon"]').forEach((el) => el.parentElement?.removeChild(el));
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    document.head.appendChild(link);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = url;
    document.head.appendChild(apple);
}

function applyLogoToTaggedImages(url: string) {
    if (typeof document === 'undefined') return;
    document.querySelectorAll<HTMLImageElement>('img[data-branding="logo"]').forEach((img) => {
        img.src = url;
    });
}

export default function BrandingApplier() {
    useEffect(() => {
        let cancelled = false;

        const apply = (b: { logo_url: string | null; favicon_url: string | null }) => {
            window.__letwBranding = b;
            const logo = resolveBrandingUrl(b.logo_url);
            const fav = resolveBrandingUrl(b.favicon_url);
            if (logo) applyLogoToTaggedImages(logo);
            if (fav) setFavicon(fav);
            window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: { logo, favicon: fav } }));
        };

        siteBrandingApi.get()
            .then((b) => { if (!cancelled) apply(b); })
            .catch(() => { /* fall back to build-time defaults */ });

        const onUpdate = (e: Event) => {
            const ce = e as CustomEvent<{ logo: string | null; favicon: string | null }>;
            if (ce.detail?.logo) applyLogoToTaggedImages(ce.detail.logo);
            if (ce.detail?.favicon) setFavicon(ce.detail.favicon);
        };
        window.addEventListener(BRANDING_EVENT, onUpdate);

        return () => {
            cancelled = true;
            window.removeEventListener(BRANDING_EVENT, onUpdate);
        };
    }, []);

    return null;
}

export function announceBrandingUpdate(branding: { logo_url: string | null; favicon_url: string | null }) {
    if (typeof window === 'undefined') return;
    const logo = resolveBrandingUrl(branding.logo_url);
    const fav = resolveBrandingUrl(branding.favicon_url);
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: { logo, favicon: fav } }));
}
