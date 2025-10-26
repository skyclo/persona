import React, { useState } from "react"
import { Play } from "lucide-react"
import { useFetcher } from "react-router"

export default function Navbar({
    args,
    questions,
    result,
    setResult,
    error,
    setError,
}: {
    args: any
    questions: any
    result: JSON[] | null
    setResult: (data: JSON[] | null) => void
    error: string | null
    setError: (error: string | null) => void
}) {
    const fetcher = useFetcher()
    const loading = fetcher.state !== "idle"

    // update result/error when fetcher returns data
    React.useEffect(() => {
        if (fetcher.data) {
            setResult(fetcher.data)
            setError(fetcher.data?.error ?? null)
        }
    }, [fetcher.data])

    console.log(result || error)
    return (
        <nav className="absolute top-0 z-40 flex h-14 w-full items-center border-b border-[rgba(255,255,255,0.03)] bg-[rgba(0,0,0,0.4)] px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className="text-lg font-semibold text-sky-300">Persona</div>
                <div className="text-xs text-gray-400">Survey · Analytics</div>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <button className="cursor-pointer rounded-md bg-[rgba(255,255,255,0.02)] px-3 py-1 text-sm text-gray-200">
                    Dashboard
                </button>
                <button className="cursor-pointer rounded-md bg-[rgba(255,255,255,0.02)] px-3 py-1 text-sm text-gray-200">
                    Responses
                </button>
                <div>
                    <button
                        type="button"
                        onClick={() => {
                            if (loading) return
                            const payload = { args: args ?? {}, questions: questions ?? [] }
                            fetcher.submit(payload, {
                                action: "/api/v1/run",
                                method: "post",
                                encType: "application/json",
                            })
                        }}
                        disabled={loading}
                        aria-disabled={loading}
                        className={
                            loading
                                ? "flex cursor-not-allowed items-center gap-2 rounded-md bg-gray-500 px-3 py-1 text-sm text-white opacity-80"
                                : "flex cursor-pointer items-center gap-2 rounded-md bg-sky-600 px-3 py-1 text-sm text-white"
                        }>
                        {loading ? (
                            <>
                                <svg
                                    className="mr-2 h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                Running...
                            </>
                        ) : (
                            <>
                                <Play size={14} />
                                Run Survey
                            </>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    )
}
