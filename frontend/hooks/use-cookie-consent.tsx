'use client';

import { useState, useEffect } from 'react';

export interface CookieConsent {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
}

export const useCookieConsent = () => {
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        // Small delay to ensure proper hydration
        const timer = setTimeout(() => {
            const savedConsent = localStorage.getItem('cookie-consent');
            if (savedConsent) {
                setConsent(JSON.parse(savedConsent));
                setShowBanner(false);
            } else {
                setShowBanner(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const saveConsent = (newConsent: CookieConsent) => {
        setConsent(newConsent);
        localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
        localStorage.setItem('cookie-consent-date', new Date().toISOString());
        setShowBanner(false);
    };

    const acceptAll = () => {
        const allAccepted: CookieConsent = {
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true,
        };
        saveConsent(allAccepted);
    };

    const acceptNecessary = () => {
        const necessaryOnly: CookieConsent = {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
        };
        saveConsent(necessaryOnly);
    };

    const resetConsent = () => {
        localStorage.removeItem('cookie-consent');
        localStorage.removeItem('cookie-consent-date');
        setConsent(null);
        setShowBanner(true);
    };

    return {
        consent,
        showBanner: isClient && showBanner,
        saveConsent,
        acceptAll,
        acceptNecessary,
        resetConsent,
    };
};