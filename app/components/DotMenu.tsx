import React, { useEffect, useRef, useState } from "react"
import { MoreVertical } from "lucide-react"

export default function DotMenu({ respondent }: { respondent: any }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement | null>(null)

    const copyJSON = async () => {
        try {
            const raw = JSON.stringify(respondent ?? {}, null, 2)
            await navigator.clipboard.writeText(raw)
            setOpen(false)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        function onDocMouseDown(e: MouseEvent) {
            if (!rootRef.current) return
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }

        if (open) {
            document.addEventListener("mousedown", onDocMouseDown)
            document.addEventListener("keydown", onKey)
        }

        return () => {
            document.removeEventListener("mousedown", onDocMouseDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    return (
        <div ref={rootRef} className="relative inline-block">
            <button
                onClick={() => setOpen(v => !v)}
                className="rounded p-1 hover:bg-[rgba(255,255,255,0.02)]">
                <MoreVertical className="h-4 w-4" />
            </button>
            {open ? (
                <div className="absolute right-0 mt-2 w-48 rounded border border-[rgba(255,255,255,0.04)] bg-[rgba(6,8,15,0.9)] p-2 text-sm shadow-lg">
                    <button
                        onClick={copyJSON}
                        className="w-full px-2 py-1 text-left hover:bg-[rgba(255,255,255,0.02)]">
                        Copy raw JSON
                    </button>
                </div>
            ) : null}
        </div>
    )
}
