'use client';

interface PrivacyPolicyProps {
    onAccept?: () => void;
    onDecline?: () => void;
    compact?: boolean;
}

export const PrivacyPolicy = ({ onAccept, onDecline, compact = false }: PrivacyPolicyProps) => {
    const currentDate = new Date().toLocaleDateString('en-US');

    if (compact) {
        return (
            <div className="text-xs text-gray-300 space-y-2">
                <p>
                    By registering, you agree to our{' '}
                    <a href="/privacy" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="/terms" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Terms of Service
                    </a>
                    .
                </p>
                <p>
                    You also consent to the processing of personal data in accordance with GDPR.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                <p className="text-blue-100 text-sm">
                    Your privacy is important to us • Last updated: {currentDate}
                </p>
            </div>

            {/* Content */}
            <div className="px-8 py-6 max-h-96 overflow-y-auto custom-scrollbar">
                <div className="space-y-8 text-gray-700">
                    <section className="border-l-4 border-blue-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                            General Information
                        </h2>
                        <p className="leading-relaxed">
                            This Privacy Policy sets out the principles for processing and protecting personal data
                            of users using our <span className="font-semibold text-blue-600">KAT Poker</span> online game application.
                        </p>
                    </section>

                    <section className="border-l-4 border-green-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                            Data Controller
                        </h2>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="leading-relaxed">
                                The controller of your personal data is <strong>KAT Poker Games Ltd.</strong>
                            </p>
                            <div className="mt-3 text-sm text-gray-600">
                                <p>📧 Email: privacy@katpoker.com</p>
                                <p>📍 Address: [Company Address]</p>
                            </div>
                        </div>
                    </section>

                    <section className="border-l-4 border-purple-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                            Data We Collect
                        </h2>
                        <div className="grid gap-3">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-400">
                                <h4 className="font-semibold text-blue-900 mb-2">🔍 Identification Data</h4>
                                <p className="text-sm text-blue-800">Username, email address, profile information</p>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-l-4 border-green-400">
                                <h4 className="font-semibold text-green-900 mb-2">💻 Technical Data</h4>
                                <p className="text-sm text-green-800">IP address, device information, browser data</p>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border-l-4 border-purple-400">
                                <h4 className="font-semibold text-purple-900 mb-2">🎮 Game Data</h4>
                                <p className="text-sm text-purple-800">Game statistics, preferences, achievements</p>
                            </div>
                        </div>
                    </section>

                    <section className="border-l-4 border-orange-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                            How We Use Your Data
                        </h2>
                        <div className="space-y-2">
                            {[
                                '🎯 Providing online poker game services',
                                '💬 Communication with users',
                                '📈 Improving service quality',
                                '🔒 Ensuring security and fair play',
                                '🏆 Managing tournaments and leaderboards'
                            ].map((item, index) => (
                                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-sm">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="border-l-4 border-red-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                            Legal Basis
                        </h2>
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <p className="leading-relaxed">
                                Data processing is based on <strong>user consent</strong> (Article 6(1)(a) GDPR)
                                and for the <strong>performance of a contract</strong> (Article 6(1)(b) GDPR).
                            </p>
                        </div>
                    </section>

                    <section className="border-l-4 border-indigo-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                            Your Rights
                        </h2>
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                            <p className="font-semibold text-indigo-900 mb-3">Under GDPR, you have the following rights:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {[
                                    '✅ Right of access to data',
                                    '✏️ Right to rectification of data',
                                    '🗑️ Right to erasure of data',
                                    '⏸️ Right to restriction of processing',
                                    '📤 Right to data portability',
                                    '❌ Right to withdraw consent'
                                ].map((right, index) => (
                                    <div key={index} className="flex items-center text-indigo-800">
                                        <span>{right}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="border-l-4 border-yellow-500 pl-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                            <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">7</span>
                            Cookies
                        </h2>
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="leading-relaxed">
                                Our website uses cookies to enhance your gaming experience.
                                You can find detailed information and manage your preferences in the
                                <span className="font-semibold text-yellow-800"> cookie settings</span> on our website.
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer with buttons */}
            {(onAccept || onDecline) && (
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                    <div className="flex gap-4">
                        {onDecline && (
                            <button
                                onClick={onDecline}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                                Decline
                            </button>
                        )}
                        {onAccept && (
                            <button
                                onClick={onAccept}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                                Accept & Continue
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
            `}</style>
        </div>
    );
};