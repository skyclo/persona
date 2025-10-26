import React from "react"

type Props = {
    collapsed?: boolean
    width?: number // px
    collapsedWidth?: number // px
}

export default function RightPanel({ collapsed = false, width = 384, collapsedWidth = 56 }: Props) {
    const panelWidth = collapsed ? collapsedWidth : width

    return (
        <aside
            className={`flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.04)] bg-[rgba(10,18,35,0.6)] text-white shadow-lg backdrop-blur ${collapsed ? "items-center py-3" : "p-4"}`}
            style={{ width: panelWidth, padding: collapsed ? 8 : 16 }}>
            {collapsed ? (
                // nothing visible inside when collapsed
                <div className="h-full w-full" />
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-700 text-2xl text-sky-200">
                            👤
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-sky-200">Participant</h2>
                            <p className="text-sm text-gray-300">Demographics & recent responses</p>
                        </div>
                    </div>

                    <section className="mt-4 flex-1 space-y-3 overflow-auto text-sm text-gray-200">
                        <div>
                            <strong>Age:</strong> 28
                        </div>
                        <div>
                            <strong>Location:</strong> San Francisco, CA
                        </div>
                        <div>
                            <strong>Latest Responses:</strong>
                            <ul className="mt-2 ml-5 list-disc text-gray-300">
                                <li>Q1: Option A</li>
                                <li>Q2: Option C</li>
                                <li>Q3: Option B</li>
                            </ul>
                        </div>
                    </section>
                </>
            )}
        </aside>
    )
}
