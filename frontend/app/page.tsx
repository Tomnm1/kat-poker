import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center ">
            <h1 className="text-4xl font-bold text-white">KAT Poker</h1>
            <p className="mt-4 text-lg text-gray-400">Welcome to KAT Poker!</p>
            <Link
                href="/newgame"
                className="mt-6 px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
            >
                Start a New Game
            </Link>
            <Link
                href="/joinGame"
                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200"
            >
                Join an Existing Game
            </Link>
        </div>
    );
}
