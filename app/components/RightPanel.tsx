import React from "react";

export default function RightPanel() {
    return (
        <aside className="fixed right-6 top-16 bottom-6 w-96 max-w-full p-6 bg-[rgba(10,18,35,0.6)] backdrop-blur rounded-2xl border border-[rgba(255,255,255,0.04)] shadow-lg text-white overflow-auto">
            <header className="flex items-center gap-4">
                <div className="w-16 h-16 bg-sky-700 rounded-full flex items-center justify-center text-2xl text-sky-200">👤</div>
                <div>
                    <h2 className="text-2xl font-semibold text-sky-200">Participant</h2>
                    <p className="text-sm text-gray-300">Demographics & recent responses</p>
                </div>
            </header>

            <section className="mt-6 space-y-3 text-sm text-gray-200">
                <div>
                    <strong>Age:</strong> 28
                </div>
                <div>
                    <strong>Location:</strong> San Francisco, CA
                </div>
                <div>
                    <strong>Latest Responses:</strong>
                    <ul className="list-disc ml-5 mt-2 text-gray-300">
                        <li>Q1: Option A</li>
                        <li>Q2: Option C</li>
                        <li>Q3: Option B</li>
                    </ul>
                </div>
            </section>
        </aside>
    );
}
