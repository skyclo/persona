import React from "react"
import { MapPin, Briefcase, Calendar, User, Users, Activity } from "lucide-react"
import IndividualDemographicCard from "~/components/IndividualDemographicCard"
import DotMenu from "~/components/DotMenu"

type Props = {
    collapsed?: boolean
    width?: number // px
    collapsedWidth?: number // px
    // data is the API response array
    data?: any[]
    selectedIndex?: number
    onDeselect?: () => void
    questions?: any[]
}

export default function RightPanel({
    collapsed = false,
    width = 384,
    collapsedWidth = 56,
    data = [],
    selectedIndex = 0,
    onDeselect,
    questions = [],
}: Props) {
    const panelWidth = collapsed ? collapsedWidth : width

    const respondent =
        Array.isArray(data) && data.length > 0 && typeof selectedIndex === "number"
            ? (data[selectedIndex] ?? null)
            : null

    return (
        <aside
            className={`flex h-full max-h-[calc(100vh-3.5rem)] flex-col overflow-auto rounded-2xl border border-[rgba(255,255,255,0.04)] bg-[rgba(10,18,35,0.6)] text-white shadow-lg backdrop-blur ${collapsed ? "items-center p-3" : "p-4"}`}
            style={{
                width: panelWidth,
                transition: "width 300ms ease, padding 300ms ease, opacity 200ms ease",
            }}>
            {collapsed ? (
                // nothing visible inside when collapsed
                <div className="h-full w-full" />
            ) : (
                <>
                    <div className="flex w-full flex-row items-center">
                        <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-700 text-2xl text-sky-200">
                            <User />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="truncate text-2xl font-semibold text-sky-200">
                                {respondent
                                    ? `${respondent.firstName ?? ""} ${respondent.lastName ?? ""}`
                                    : "No respondent"}
                            </h2>
                            <p className="truncate text-sm text-gray-300">Individual Participant</p>
                        </div>
                        <div className="mr-6 ml-auto text-gray-300">
                            {respondent ? <DotMenu respondent={respondent} /> : null}
                        </div>
                    </div>

                    <section className="mt-4 flex-1 overflow-auto text-sm text-gray-200 transition-all duration-300">
                        {respondent ? (
                            <div className="space-y-3">
                                {/* <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => onDeselect && onDeselect()}
                                        className="rounded bg-[rgba(255,255,255,0.03)] px-2 py-1 text-xs text-gray-300 hover:bg-[rgba(255,255,255,0.05)]">
                                        Deselect
                                    </button>
                                </div> */}

                                <div className="grid grid-cols-2 gap-3">
                                    <IndividualDemographicCard
                                        Icon={Calendar}
                                        label="Age"
                                        header={respondent.age ?? "—"}
                                    />

                                    {/* Gender moved into its own card */}
                                    <IndividualDemographicCard
                                        Icon={Users}
                                        label="Gender"
                                        header={respondent.gender ?? "—"}
                                    />

                                    <IndividualDemographicCard
                                        Icon={MapPin}
                                        label="Location"
                                        header={
                                            respondent.location
                                                ? `${respondent.location.city ?? ""}`
                                                : "—"
                                        }
                                        subheader={
                                            respondent.location
                                                ? [
                                                      respondent.location.state ?? "",
                                                      respondent.location.country ?? "",
                                                  ]
                                                : undefined
                                        }
                                    />

                                    <IndividualDemographicCard
                                        Icon={Briefcase}
                                        label="Employment"
                                        header={respondent.employment?.title ?? "—"}
                                        subheader={[
                                            respondent.employment?.industry ?? "N/A",
                                            respondent.employment?.jobType ?? "Other",
                                            respondent.employment?.salary
                                                ? `$${new Intl.NumberFormat().format(respondent.employment.salary)}/yr`
                                                : "unknown",
                                        ]}
                                    />

                                    {/* Race & Hispanic ethnicity moved into their own card */}
                                    <IndividualDemographicCard
                                        Icon={Users}
                                        label="Race & Ethnicity"
                                        header={respondent.race ?? "—"}
                                        subheader={[
                                            respondent.isHispanic ? "Hispanic" : "Not Hispanic",
                                        ]}
                                    />
                                </div>

                                {/* thin divider between demographics and responses */}
                                <div className="my-4 h-px w-full bg-[rgba(255,255,255,0.03)]" />

                                {/* Raw response preview removed by request */}

                                <div className="pt-0">
                                    <h4 className="text-sm font-medium text-sky-200">Responses</h4>
                                    <div className="mt-2 space-y-2 pr-4 text-sm text-gray-200">
                                        {questions && Array.isArray(questions) ? (
                                            questions.map((q, idx) => {
                                                const resp = respondent.response ?? {}
                                                const rawAnswer = resp[idx] ?? null
                                                const answer =
                                                    rawAnswer === null ||
                                                    rawAnswer === "null" ||
                                                    (typeof rawAnswer === "string" &&
                                                        rawAnswer.trim() === "")
                                                        ? null
                                                        : rawAnswer

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="rounded bg-[rgba(255,255,255,0.02)] p-2">
                                                        <div className="text-xs text-gray-300">
                                                            Q{idx + 1}
                                                        </div>
                                                        <div className="font-medium">
                                                            {q.content}
                                                        </div>
                                                        {answer === null ? (
                                                            <div className="mt-1 text-sm text-gray-400">
                                                                <em>Skipped</em>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1 text-sm text-sky-300">
                                                                {Array.isArray(answer)
                                                                    ? answer.join(", ")
                                                                    : String(answer)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-sm text-gray-400">
                                                No questions to cross reference
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400">
                                No data available. Load survey responses to view a participant.
                            </div>
                        )}
                    </section>
                </>
            )}
        </aside>
    )
}
