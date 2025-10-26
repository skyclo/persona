import React from "react"

export default function IndividualDemographicCard({
    Icon,
    label,
    header,
    subheader,
    children,
}: {
    Icon: any
    label?: string
    header?: React.ReactNode
    subheader?: Array<React.ReactNode | string>
    children?: React.ReactNode
}) {
    return (
        <div className="rounded-lg bg-[rgba(255,255,255,0.025)] p-3">
            <div className="flex items-start gap-3">
                <div className="text-sky-300">{Icon ? <Icon /> : null}</div>
                <div className="flex-1">
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="text-sm font-medium text-gray-200">{header}</div>
                    {subheader ? (
                        <div className="space-y-0.5">
                            {(subheader as Array<React.ReactNode>).map((s, i) => (
                                <div key={i} className="truncate font-mono text-2xs text-gray-400">
                                    {s}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            {children ? <div className="mt-3 text-sm text-gray-200">{children}</div> : null}
        </div>
    )
}
