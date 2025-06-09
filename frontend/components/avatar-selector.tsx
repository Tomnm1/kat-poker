
'use client';

import { useState, useEffect } from 'react';
import { getData } from '@/app/utils/http';

interface AvatarSelectorProps {
    selected: string;
    onSelect: (avatar: string) => void;
    disabled?: boolean;
}

export const AvatarSelector = ({ selected, onSelect, disabled = false }: AvatarSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [avatars, setAvatars] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                const response = await getData('/avatars');
                if (response && response.avatars) {
                    setAvatars(response.avatars);
                } else {
                    setAvatars([
                        "🎭", "🎪", "🎨", "🎯", "🎲", "🃏", "👑", "💎",
                        "🦄", "🐉", "🔥", "⭐", "🌟", "💫", "🎊", "🎈"
                    ]);
                }
            } catch (error) {
                console.error('Error fetching avatars:', error);
                setAvatars([
                    "🎭", "🎪", "🎨", "🎯", "🎲", "🃏", "👑", "💎",
                    "🦄", "🐉", "🔥", "⭐", "🌟", "💫", "🎊", "🎈"
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchAvatars();
    }, []);

    if (loading) {
        return (
            <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Choose your avatar
                </label>
                <div className="flex items-center gap-3 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg">
                    <div className="animate-pulse bg-gray-600 rounded w-8 h-8"></div>
                    <span className="text-gray-300">Loading avatars...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose your avatar
            </label>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-3 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg transition-colors ${
                    disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-600 cursor-pointer'
                }`}
            >
                <span className="text-2xl">{selected || "🎭"}</span>
                <span className="text-gray-300 flex-1 text-left">
                    {selected ? 'Avatar selected' : 'Select avatar'}
                </span>
                <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {isOpen && !disabled && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-lg p-4 grid grid-cols-4 gap-2 z-20 shadow-xl max-h-48 overflow-y-auto">
                        {avatars.map((avatar) => (
                            <button
                                key={avatar}
                                type="button"
                                onClick={() => {
                                    onSelect(avatar);
                                    setIsOpen(false);
                                }}
                                className={`text-2xl p-3 rounded-lg hover:bg-gray-600 transition-colors transform hover:scale-110 ${
                                    selected === avatar ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-800'
                                }`}
                                title={`Select ${avatar} avatar`}
                            >
                                {avatar}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};