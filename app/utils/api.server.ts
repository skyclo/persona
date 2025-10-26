export async function gen(args: any, questions: any, env: any) {
    // Prefer generic name, fall back to legacy N8N name for compatibility
    const url = env?.N8N_WEBHOOK_URL
    if (!url) throw new Error("API URL not specified.")

    const q = questions || []

    const res = await fetch(url + "/gen_personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            numberPersonas: args.numberPersonas || 100,
            industry: args.industry || "anything",
            region: args.region || "worldwide",
            age: { low: args.age?.low || 18, high: args.age?.high || 60 },
            questions: q,
        }),
    })

    try {
        if (res.status == 404) {
            return { error: "API endpoint not started" }
        } else if (!res.ok) {
            throw new Error(await res.text())
        }
        return await res.json()
    } catch (e) {
        console.error("Error parsing API response JSON:", e)
        return Promise.reject({ error: "Invalid JSON response from API. Status: " + res.status })
    }
}

export async function summary(responses: any[], env: any) {
    const url = env?.N8N_WEBHOOK_URL
    if (!url) throw new Error("API URL not specified.")

    const res = await fetch(url + "/gen_summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
    })

    try {
        if (res.status == 404) {
            return { error: "API endpoint not started" }
        } else if (!res.ok) {
            throw new Error(await res.text())
        }
        return await res.json()
    } catch (e) {
        console.error("Error parsing API response JSON:", e)
        return Promise.reject({ error: "Invalid JSON response from API. Status: " + res.status })
    }
}
