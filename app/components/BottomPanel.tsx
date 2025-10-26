import React, { useMemo } from "react"
import { Users, BarChart2, Briefcase, Activity } from "lucide-react"

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

function formatAnswerForDisplay(ans: any) {
    // normalize boolean-like strings to capitalized True/False
    if (typeof ans === "boolean") return ans ? "True" : "False"
    if (typeof ans === "string") {
        const low = ans.trim().toLowerCase()
        if (low === "true") return "True"
        if (low === "false") return "False"
        return ans
    }
    return String(ans)
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
            const range = { min: sorted[0], max: sorted[sorted.length - 1] }

            let quantile = (p: number) => {
                const pos = (sorted.length - 1) * p
                const base = Math.floor(pos)
                const rest = pos - base
                if (sorted[base + 1] !== undefined) {
                    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
                } else {
                    return sorted[base]
                }
            }
            const q1 = quantile(0.24)
            const q3 = quantile(0.75)
            const median = quantile(0.5)

            stats = { mean, median, range, q1, q3, count: values.length }
        }

        const totalResponses =
            Object.values(counts).reduce((a, b) => a + b, 0) + (stats ? stats.count : 0)

        return { question: q.content ?? `Q${qi + 1}`, counts, stats, totalResponses, type: q.type }
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
                            <div className="flex items-center gap-2 text-gray-300">
                                <Briefcase className="text-sky-300" />
                                <div className="text-sm">Top Industries</div>
                            </div>
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
                            <div className="flex items-center gap-2 text-gray-300">
                                <Activity className="text-sky-300" />
                                <div className="text-sm">Top Job Titles</div>
                            </div>
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
                                        <div className="mt-2 flex items-center gap-9 text-xs text-gray-200">
                                            <div className="w-48 pl-4">
                                                <div className="w-full">
                                                    <strong>Mean:</strong> {b.stats.mean.toFixed(2)}
                                                </div>
                                                <div className="w-full">
                                                    <strong>Median:</strong> {b.stats.median}
                                                </div>
                                                <div className="w-full">
                                                    <strong>Range:</strong> {b.stats.range.min} -{" "}
                                                    {b.stats.range.max}
                                                </div>
                                            </div>

                                            {/* Box-and-whisker chart */}
                                            <div className="w-full flex-1">
                                                <svg
                                                    width="100%"
                                                    height="40"
                                                    viewBox="0 0 160 40"
                                                    preserveAspectRatio="xMinYMid meet"
                                                    aria-hidden>
                                                    {/* horizontal axis padding */}
                                                    <defs>
                                                        <linearGradient id={`g-${i}`} x1="0" x2="1">
                                                            <stop offset="0%" stopColor="#38bdf8" />
                                                            <stop
                                                                offset="100%"
                                                                stopColor="#06b6d4"
                                                            />
                                                        </linearGradient>
                                                    </defs>
                                                    {(() => {
                                                        const min = b.stats.range.min
                                                        const max = b.stats.range.max
                                                        const q1 = b.stats.q1 ?? min
                                                        const q3 = b.stats.q3 ?? max
                                                        const pad = 8
                                                        const w = 160 - pad * 2
                                                        const scale = (v: number) =>
                                                            pad +
                                                            ((v - min) / Math.max(1, max - min)) * w

                                                        const xMin = scale(min)
                                                        const xQ1 = scale(q1)
                                                        const xMed = scale(b.stats.median)
                                                        const xQ3 = scale(q3)
                                                        const xMax = scale(max)

                                                        return (
                                                            <g>
                                                                {/* whiskers (near-white stroke for maximum contrast) */}
                                                                <line
                                                                    x1={xMin}
                                                                    y1={20}
                                                                    x2={xQ1}
                                                                    y2={20}
                                                                    stroke="rgba(255,255,255,0.95)"
                                                                    strokeWidth="3"
                                                                />
                                                                <line
                                                                    x1={xQ3}
                                                                    y1={20}
                                                                    x2={xMax}
                                                                    y2={20}
                                                                    stroke="rgba(255,255,255,0.95)"
                                                                    strokeWidth="3"
                                                                />

                                                                {/* box (light fill, brighter cyan stroke) */}
                                                                <rect
                                                                    x={xQ1}
                                                                    y={10}
                                                                    width={Math.max(2, xQ3 - xQ1)}
                                                                    height={20}
                                                                    fill={`url(#g-${i})`}
                                                                    fillOpacity={0.15}
                                                                    stroke="rgba(56,189,248,0.36)"
                                                                    strokeWidth={1.5}
                                                                />

                                                                {/* median (bright) */}
                                                                <line
                                                                    x1={xMed}
                                                                    y1={10}
                                                                    x2={xMed}
                                                                    y2={30}
                                                                    stroke="#38bdf8"
                                                                    strokeWidth="3"
                                                                />

                                                                {/* min/max caps (bright cyan) */}
                                                                <line
                                                                    x1={xMin}
                                                                    y1={14}
                                                                    x2={xMin}
                                                                    y2={26}
                                                                    stroke="#7dd3fc"
                                                                    strokeWidth="3"
                                                                />
                                                                <line
                                                                    x1={xMax}
                                                                    y1={14}
                                                                    x2={xMax}
                                                                    y2={26}
                                                                    stroke="#7dd3fc"
                                                                    strokeWidth="3"
                                                                />
                                                            </g>
                                                        )
                                                    })()}
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            {(() => {
                                                const entries = Object.entries(b.counts)
                                                // if short/long response, show only first 3 items
                                                const isTextResp =
                                                    b.type === "short_response" ||
                                                    b.type === "long_response"
                                                if (isTextResp) {
                                                    const first = entries.slice(0, 3)
                                                    const remaining = Math.max(
                                                        0,
                                                        entries.length - first.length
                                                    )
                                                    return (
                                                        <div className="space-y-2">
                                                            {first.map(([ans, cnt], idx) => (
                                                                <div key={ans} className="pl-4">
                                                                    <div className="truncate text-sm text-gray-200">
                                                                        {formatAnswerForDisplay(
                                                                            ans
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {remaining > 0 && (
                                                                <div className="pl-4 text-xs text-gray-400 italic">
                                                                    ...{remaining} more responses
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }

                                                // default rendering for choice counts
                                                return entries.map(([ans, cnt], choiceIdx) => {
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
                                                                {formatAnswerForDisplay(ans)}
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
                                                })
                                            })()}
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
