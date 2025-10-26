import { ChevronDown } from "lucide-react"
import React from "react"

export default function ToggleButton({
    ariaLabel,
    title,
    expanded,
    onClick,
    direction = "down",
    size = 18,
    extraClass = "",
    style,
}: {
    ariaLabel: string
    title?: string
    expanded?: boolean
    onClick: () => void
    direction?: "down" | "up" | "left" | "right"
    size?: number
    extraClass?: string
    style?: React.CSSProperties
}) {
    // map direction to rotation class
    const rotClass =
        direction === "down"
            ? "rotate-0"
            : direction === "up"
              ? "rotate-180"
              : direction === "left"
                ? "-rotate-90"
                : "rotate-90"

    return (
        <button
            aria-label={ariaLabel}
            title={title}
            aria-expanded={expanded}
            onClick={onClick}
            style={style}
            className={`relative z-50 m-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded bg-gray-800 text-white shadow-md ring-1 ring-white/10 hover:bg-sky-500 ${extraClass}`}>
            <ChevronDown size={size} className={`transform ${rotClass}`} />
        </button>
    )
}
