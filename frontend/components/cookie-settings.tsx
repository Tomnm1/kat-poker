'use client';

import { useState } from 'react';
import {CookieConsent, useCookieConsent} from "@/hooks/use-cookie-consent";

interface CookieSettingsProps {
    onCloseAction: () => void;
}

export const CookieSettings = ({ onCloseAction }: CookieSettingsProps) => {
    const { saveConsent } = useCookieConsent();
    const [settings, setSettings] = useState<CookieConsent>({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
    });

    const handleToggle = (key: keyof CookieConsent) => {
        if (key === 'necessary') return;

        setSettings(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = () => {
        saveConsent(settings);
        onCloseAction();
    };

    const handleAcceptAll = () => {
        const allAccepted: CookieConsent = {
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true,
        };
        saveConsent(allAccepted);
        onCloseAction();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Cookie Settings</h2>
                        <button
                            onClick={onCloseAction}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="text-sm text-gray-600">
                            <p className="mb-4">
                                Our website uses cookies to ensure you get the best user experience.
                                You can choose which categories of cookies you want to accept.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Necessary Cookies</h3>
                                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                        Always Active
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    These cookies are essential for the website to function and cannot be switched off.
                                    They enable basic functions like security and accessibility.
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.analytics}
                                            onChange={() => handleToggle('analytics')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Help us understand how users interact with our website to improve the user experience.
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.marketing}
                                            onChange={() => handleToggle('marketing')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Used to display personalized advertisements and track the effectiveness of marketing campaigns.
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Preference Cookies</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.preferences}
                                            onChange={() => handleToggle('preferences')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Remember your preferences and settings to improve your experience on future visits.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Accept All
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-gray-200 text-gray-900 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            Save Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};