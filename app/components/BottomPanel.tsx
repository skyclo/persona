import React, { useMemo } from "react"
import { Users, BarChart2 } from "lucide-react"

type Props = {
    collapsed?: boolean
    data?: any[]
    questions?: any[]
    onSelectRespondent?: (index: number) => void
}

function aggregateData(data: any[]) {
    if (!Array.isArray(data) || data.length === 0) return null

    const ages: number[] = []
    const genderCounts: Record<string, number> = {}
    const industries: Record<string, number> = {}
    const titles: Record<string, number> = {}

    for (const r of data) {
        if (typeof r.age === "number") ages.push(r.age)
        const g = r.gender ?? "Unknown"
        genderCounts[g] = (genderCounts[g] || 0) + 1
        const ind = r.employment?.industry ?? "Unknown"
        industries[ind] = (industries[ind] || 0) + 1
        const t = r.employment?.title ?? "Unknown"
        titles[t] = (titles[t] || 0) + 1
    }

    const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null

    const top = (map: Record<string, number>, n = 3) =>
        Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)

    return {
        count: data.length,
        avgAge,
        genderCounts,
        topIndustries: top(industries),
        topTitles: top(titles),
    }
}

function questionBreakdown(data: any[], questions: any[] | undefined) {
    if (!questions || !Array.isArray(questions)) return []
    return questions.map((q, qi) => {
        const counts: Record<string, number> = {}
        const values: number[] = []

        for (const r of data) {
            const resp = r.response?.json ?? r.response ?? {}
            const rawAnswer = resp[qi] ?? resp[q.content] ?? null

            // normalize skipped answers: null, "null", or empty string
            const skipped =
                rawAnswer === null ||
                rawAnswer === "null" ||
                (typeof rawAnswer === "string" && rawAnswer.trim() === "")
            if (skipped) continue

            const answer = rawAnswer

            if (q.type === "scale") {
                const num = Number(answer)
                if (!Number.isNaN(num)) values.push(num)
            } else if (Array.isArray(answer)) {
                for (const a of answer) {
                    // skip empty/null elements inside arrays as well
                    if (a === null || a === "null" || (typeof a === "string" && a.trim() === ""))
                        continue
                    counts[a] = (counts[a] || 0) + 1
                }
            } else {
                counts[answer] = (counts[answer] || 0) + 1
            }
        }

        let stats = null
        if (values.length) {
            const sorted = [...values].sort((a, b) => a - b)
            const sum = values.reduce((a, b) => a + b, 0)
            const mean = sum / values.length
            const median =
                sorted.length % 2 === 1
                    ? sorted[(sorted.length - 1) / 2]
                    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            const range = { min: sorted[0], max: sorted[sorted.length - 1] }
            stats = { mean, median, range, count: values.length }
        }

        const totalResponses =
            Object.values(counts).reduce((a, b) => a + b, 0) + (stats ? stats.count : 0)

        return { question: q.content ?? `Q${qi + 1}`, counts, stats, totalResponses }
    })
}

export default function BottomPanel({
    collapsed = false,
    data = [],
    questions = [],
    onSelectRespondent,
}: Props) {
    const summary = useMemo(() => aggregateData(data), [data])
    const breakdown = useMemo(() => questionBreakdown(data, questions), [data, questions])

    return (
        <div
            className={`rounded-3xl border border-[rgba(255,255,255,0.03)] bg-[rgba(6,8,15,0.6)] text-white backdrop-blur ${collapsed ? "flex h-12 w-full items-center justify-center" : "max-h-64 w-full overflow-auto p-6"}`}
            style={{ transition: "max-height 320ms ease, padding 320ms ease, opacity 200ms ease" }}>
            {!collapsed && (
                <div className="w-full" style={{ transition: "opacity 220ms ease", opacity: 1 }}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-sky-200">Survey Summary</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <BarChart2 className="text-sky-300" />
                            <div>{summary ? `${summary.count} responses` : "No responses"}</div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-[rgba(255,255,255,0.02)] p-4">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Users className="text-sky-300" />
                                <div className="text-sm">Demographics</div>
                            </div>

                            {summary ? (
                                <div className="mt-3 space-y-2 text-sm text-gray-200">
                                    <div>
                                        <strong>Average age:</strong> {summary.avgAge ?? "—"}
                                    </div>
                                    <div>
                                        <strong>Gender:</strong>
                                        <div className="mt-1 flex gap-2">
                                            {Object.entries(summary.genderCounts).map(([k, v]) => (
                                                <div
                                                    key={k}
                                                    className="rounded bg-[rgba(255,255,255,0.02)] px-2 py-1 text-xs text-gray-200">
                                                    {k}: {v}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 text-sm text-gray-400">
                                    No demographic data
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg bg-[rgba(255,255,255,0.02)] p-4">
                            <div className="text-sm text-gray-300">Top Industries</div>
                            {summary ? (
                                <div className="mt-2 space-y-2 text-sm text-gray-200">
                                    {summary.topIndustries.map(([name, count]: any) => (
                                        <div
                                            key={name}
                                            className="flex items-center justify-between">
                                            <div className="text-sm">{name}</div>
                                            <div className="text-xs text-sky-300">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-gray-400">—</div>
                            )}
                        </div>

                        <div className="col-span-2 rounded-lg bg-[rgba(255,255,255,0.02)] p-4">
                            <div className="text-sm text-gray-300">Top Job Titles</div>
                            {summary ? (
                                <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-200">
                                    {summary.topTitles.map(([name, count]: any) => (
                                        <div
                                            key={name}
                                            className="rounded bg-[rgba(255,255,255,0.02)] px-2 py-1 text-xs">
                                            {name} ({count})
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-gray-400">—</div>
                            )}
                        </div>

                        <div className="col-span-2 mt-4 space-y-3">
                            <h4 className="text-sm font-medium text-sky-200">
                                Question breakdowns
                            </h4>
                            {breakdown.length === 0 && (
                                <div className="text-sm text-gray-400">
                                    No question data available
                                </div>
                            )}
                            {breakdown.map((b, i) => (
                                <section
                                    key={i}
                                    className="rounded-lg bg-[rgba(255,255,255,0.02)] p-3">
                                    <div className="flex items-center justify-between text-sm text-gray-300">
                                        <div className="font-medium">
                                            <span className="text-sky-300"> Q{i + 1}.</span>{" "}
                                            {b.question}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Responses: {b.totalResponses}
                                        </div>
                                    </div>

                                    {b.stats ? (
                                        <div className="mt-2 text-xs text-gray-200">
                                            <div>
                                                <strong>Mean:</strong> {b.stats.mean.toFixed(2)}
                                            </div>
                                            <div>
                                                <strong>Median:</strong> {b.stats.median}
                                            </div>
                                            <div>
                                                <strong>Range:</strong> {b.stats.range.min} -{" "}
                                                {b.stats.range.max}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            {Object.entries(b.counts).map(
                                                ([ans, cnt], choiceIdx) => {
                                                    // convert 0->A, 1->B, etc.
                                                    const letter = String.fromCharCode(
                                                        65 + (choiceIdx % 26)
                                                    )
                                                    return (
                                                        <div
                                                            key={ans}
                                                            className="flex items-center gap-3 pl-4">
                                                            <div className="w-8 text-sm font-medium text-sky-300">
                                                                {letter}.
                                                            </div>
                                                            <div className="w-40 truncate text-sm text-gray-200">
                                                                {ans}
                                                            </div>
                                                            <div className="h-3 flex-1 overflow-hidden rounded bg-[rgba(255,255,255,0.03)]">
                                                                <div
                                                                    className="h-3 bg-sky-500"
                                                                    style={{
                                                                        width: `${Math.round((cnt / Math.max(1, b.totalResponses)) * 100)}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="w-12 text-right text-sm text-sky-300">
                                                                {Math.round(
                                                                    (cnt /
                                                                        Math.max(
                                                                            1,
                                                                            b.totalResponses
                                                                        )) *
                                                                        100
                                                                )}
                                                                %
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            )}
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
