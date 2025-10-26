import React from "react"
import { ChevronsDown, ChevronsUp } from "lucide-react"

type Props = {
    collapsed?: boolean
}

export default function BottomPanel({ collapsed = false }: Props) {
    // example per-answer breakdown data
    const breakdown = [
        {
            question: "Q1",
            choices: [
                { label: "Option A", value: 45 },
                { label: "Option B", value: 30 },
                { label: "Option C", value: 25 },
            ],
        },
        {
            question: "Q2",
            choices: [
                { label: "Option A", value: 20 },
                { label: "Option B", value: 50 },
                { label: "Option C", value: 30 },
            ],
        },
    ]

    return (
        <div
            className={`rounded-3xl border border-[rgba(255,255,255,0.03)] bg-[rgba(6,8,15,0.6)] text-white backdrop-blur ${collapsed ? "flex h-12 w-full items-center justify-center" : "max-h-64 w-full overflow-auto p-6"}`}>
            {/* Toggle button is now externalized by the page wrapper */}

            {/* When collapsed, hide everything except the toggle (toggle is external) */}
            {!collapsed && (
                <div className="w-full">
                    <h3 className="text-lg font-semibold text-sky-200">Survey Summary</h3>

                    <div className="mt-4 space-y-4">
                        {breakdown.map(q => (
                            <section
                                key={q.question}
                                className="rounded-lg bg-[rgba(255,255,255,0.02)] p-4">
                                <div className="mb-2 flex justify-between text-sm text-gray-300">
                                    <div className="font-medium">{q.question}</div>
                                    <div className="text-xs text-gray-400">
                                        Total responses:{" "}
                                        {q.choices.reduce((s, c) => s + c.value, 0)}
                                    </div>
                                </div>

                                <div className="mb-3 text-sm text-gray-300">
                                    Question contents would go here (placeholder).
                                </div>
                                <div className="space-y-2">
                                    {q.choices.map(c => (
                                        <div key={c.label} className="flex items-center gap-3">
                                            <div className="w-36 text-sm text-gray-200">
                                                {c.label}
                                            </div>
                                            <div className="h-3 flex-1 overflow-hidden rounded bg-[rgba(255,255,255,0.03)]">
                                                <div
                                                    className="h-3 bg-sky-500"
                                                    style={{ width: `${c.value}%` }}
                                                />
                                            </div>
                                            <div className="w-12 text-right text-sm text-sky-300">
                                                {c.value}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
