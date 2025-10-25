import { gen } from "~/utils/api.server"

export async function action({ request, context }: any) {
    const body = await request.json().catch(() => null)
    if (!body)
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })

    try {
        const resp = await gen(body.args, body.questions, context.cloudflare.env)
        return new Response(JSON.stringify({ api: resp }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}

export default function Route() {
    return null
}
