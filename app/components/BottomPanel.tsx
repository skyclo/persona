import React from "react";

export default function BottomPanel() {
    // example per-answer breakdown data
    const breakdown = [
        { question: "Q1", choices: [{ label: "Option A", value: 45 }, { label: "Option B", value: 30 }, { label: "Option C", value: 25 }] },
        { question: "Q2", choices: [{ label: "Option A", value: 20 }, { label: "Option B", value: 50 }, { label: "Option C", value: 30 }] },
    ];

    return (
    <div className="fixed left-6 right-6 md:right-96 bottom-6 p-6 bg-[rgba(6,8,15,0.6)] backdrop-blur rounded-3xl border border-[rgba(255,255,255,0.03)] text-white max-h-64 overflow-auto">
            <h3 className="text-lg text-sky-200 font-semibold">Survey Summary</h3>
            <div className="mt-4 space-y-4">
                {breakdown.map((q) => (
                    <section key={q.question} className="p-4 bg-[rgba(255,255,255,0.02)] rounded-lg">
                        <div className="flex justify-between mb-2 text-sm text-gray-300">
                            <div className="font-medium">{q.question}</div>
                            <div className="text-xs text-gray-400">Total responses: {q.choices.reduce((s, c) => s + c.value, 0)}</div>
                        </div>

                        <div className="mb-3 text-sm text-gray-300">Question contents would go here (placeholder).</div>
                        <div className="space-y-2">
                            {q.choices.map((c) => (
                                <div key={c.label} className="flex items-center gap-3">
                                    <div className="w-36 text-sm text-gray-200">{c.label}</div>
                                    <div className="flex-1 bg-[rgba(255,255,255,0.03)] rounded h-3 overflow-hidden">
                                        <div className="bg-sky-500 h-3" style={{ width: `${c.value}%` }} />
                                    </div>
                                    <div className="w-12 text-right text-sm text-sky-300">{c.value}%</div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
