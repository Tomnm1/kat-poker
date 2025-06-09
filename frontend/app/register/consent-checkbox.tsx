'use client';

import { useState } from 'react';
import {PrivacyPolicy} from "@/components/privacy-policy";

interface ConsentCheckboxProps {
    checked: boolean;
    onChangeAction: (checked: boolean) => void;
    required?: boolean;
}

export const ConsentCheckbox = ({ checked, onChangeAction, required = true }: ConsentCheckboxProps) => {
    const [showPolicy, setShowPolicy] = useState(false);

    return (
        <>
            <div className="flex items-start space-x-3 pt-2">
                <input
                    type="checkbox"
                    id="privacy-consent"
                    checked={checked}
                    onChange={(e) => onChangeAction(e.target.checked)}
                    required={required}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="privacy-consent" className="text-sm text-gray-300">
                    I acknowledge that I have read the{' '}
                    <button
                        type="button"
                        onClick={() => setShowPolicy(true)}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Privacy Policy
                    </button>{' '}
                    and consent to the processing of my personal data in accordance with GDPR.
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            </div>

            {showPolicy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Privacy Policy</h2>
                                <button
                                    onClick={() => setShowPolicy(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <PrivacyPolicy
                                onAccept={() => {
                                    onChangeAction(true);
                                    setShowPolicy(false);
                                }}
                                onDecline={() => {
                                    onChangeAction(false);
                                    setShowPolicy(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};