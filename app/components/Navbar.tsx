import React from "react";
import { Play } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="w-full h-14 flex items-center px-6 bg-[rgba(0,0,0,0.4)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.03)] z-40 absolute top-0">
            <div className="flex items-center gap-4">
                <div className="text-lg font-semibold text-sky-300">Persona</div>
                <div className="text-xs text-gray-400">Survey · Analytics</div>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <button className="px-3 py-1 text-sm rounded-md bg-[rgba(255,255,255,0.02)] text-gray-200">Dashboard</button>
                <button className="px-3 py-1 text-sm rounded-md bg-[rgba(255,255,255,0.02)] text-gray-200">Responses</button>
                <button className="flex items-center gap-2 px-3 py-1 text-sm rounded-md bg-sky-600 text-white">
                    <Play size={14} />
                    Run Survey
                </button>
            </div>
        </nav>
    );
}
