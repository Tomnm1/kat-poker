'use client';

import { useState } from 'react';
import {CookieSettings} from "@/components/cookie-settings";
import {useCookieConsent} from "@/hooks/use-cookie-consent";

export const CookieBanner = () => {
    const { showBanner, acceptAll, acceptNecessary } = useCookieConsent();
    const [showSettings, setShowSettings] = useState(false);

    if (!showBanner || showSettings) {
        return showSettings ? (
            <CookieSettings onCloseAction={() => setShowSettings(false)} />
        ) : null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl p-5 transform transition-all duration-300 ease-out animate-slide-up">
            <div className="text-sm text-gray-700 mb-4">
                <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🍪</span>
                    <p className="font-semibold text-gray-900">We use cookies</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                    Our website uses cookies to ensure you get the best gaming experience possible.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={acceptAll}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                    Accept all cookies
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={acceptNecessary}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                    >
                        Essential only
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                    >
                        Customize
                    </button>
                </div>
            </div>
        </div>
    );
};