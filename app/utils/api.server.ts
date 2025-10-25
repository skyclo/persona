export async function gen(args: any, questions: any, env: any) {
    // Prefer generic name, fall back to legacy N8N name for compatibility
    const url = env?.API_WEBHOOK_URL || env?.N8N_WEBHOOK_URL
    if (!url) throw new Error("API URL not specified.")

    const q = questions || [
        {
            required: true,
            type: "multiple",
            content: "Have you heard of the term business intelligence (BI) before?",
            maxSelection: 1,
            choices: [
                "Yes, I am very familiar with business intelligence and have used it before",
                "Yes, I am familiar with business intelligence but I have not used it before",
                "No, I am not familiar with business intelligence",
            ],
        },
        {
            required: true,
            type: "multiple",
            content: "How often do you use AI?",
            maxSelection: 1,
            choices: [
                "Daily",
                "Once or twice a week",
                "Once or twice a month",
                "Rarely",
                "I have never used AI",
            ],
        },
        {
            required: true,
            type: "scale",
            content: "On a scale of 1-10, how favorable of an opinion do you have on AI?",
            maxSelection: 1,
            min: "1",
            max: "10",
        },
        {
            required: true,
            type: "multiple",
            content: "Do you use AI at work?",
            maxSelection: 1,
            choices: ["Yes", "No"],
        },
        {
            required: false,
            type: "multiple",
            content:
                "If you answered YES to the previous question, what are the top 3 things you use it for?",
            maxSelection: 3,
            choices: [
                "Automation",
                "Vibe coding",
                "Data science analysis",
                "Asking non-technical questions",
                "Asking technical questions",
                "Asking company-relevant questions",
                "Agentic programming",
            ],
        },
        {
            required: false,
            type: "short_response",
            content: "If you answered NO to the prior question, why do you NOT use AI at work?",
            maxChars: 140,
        },
    ]

    const res = await fetch(url, {
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

    const text = await res.text()
    let data: unknown = text
    try {
        data = JSON.parse(text)[0]
    } catch (e) {
        // leave as text if not JSON
    }

    return {
        status: res.status,
        ok: res.ok,
        headers: Object.fromEntries(res.headers),
        body: data,
    }
}
