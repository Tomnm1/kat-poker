'use client';

import { useState, useEffect } from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { CookieSettings } from './cookie-settings';

export const CookieStatusIndicator = () => {
    const { consent } = useCookieConsent();
    const [showSettings, setShowSettings] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (consent) {
            setIsVisible(true);
        }
    }, [consent]);

    if (!consent || !isVisible) return null;

    const getConsentCount = () => {
        return Object.values(consent).filter(Boolean).length;
    };

    const getConsentText = () => {
        const count = getConsentCount();
        if (count === 4) return 'All cookies accepted';
        if (count === 1) return 'Essential cookies only';
        return `${count}/4 cookie types accepted`;
    };

    return (
        <>
            <div className="fixed bottom-4 right-4 z-40">
                <div className="bg-white border border-gray-200 rounded-full shadow-lg p-2 flex items-center gap-2 transition-all duration-300 hover:shadow-xl group cursor-pointer">
                    <div
                        className="flex items-center gap-2 px-2"
                        onClick={() => setShowSettings(true)}
                    >
                        <span className="text-lg animate-bounce">🍪</span>
                        <div className="hidden group-hover:block transition-all duration-300">
                            <p className="text-xs text-gray-600 whitespace-nowrap">
                                {getConsentText()}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="text-gray-400 hover:text-gray-600 text-sm p-1"
                        title="Manage cookie preferences"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {showSettings && (
                <CookieSettings onCloseAction={() => setShowSettings(false)} />
            )}
        </>
    );
};