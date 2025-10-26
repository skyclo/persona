import { data } from "react-router"
import type { Route } from "./+types/api.v1.run"
import { gen } from "~/utils/api.server"

export async function action({ request, context }: Route.ActionArgs) {
    const { args, questions } = (await request.json().catch(() => null)) as {
        args?: any
        questions?: any
    }

    try {
        const resp = (await gen(args || {}, questions || [], context.cloudflare.env)) as {
            results: JSON[]
        }[]
        return resp[0].results
    } catch (err: any) {
        throw data({ error: "Internal Server Error" }, { status: 500 })
    }
}

export default function Route() {
    return null
}
