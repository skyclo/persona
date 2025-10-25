import type { Route } from "./+types/home"
import Navbar from "~/components/Navbar";
import Globe from "~/components/Globe";
import RightPanel from "~/components/RightPanel";
import BottomPanel from "~/components/BottomPanel";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Persona - Survey" },
        { name: "description", content: "Survey visualization and responses" },
    ]
}

export function loader({ context }: Route.LoaderArgs) {
    // Use a declared env var from wrangler.jsonc; return it for the UI to consume if needed
    return { message: context.cloudflare.env.N8N_WEBHOOK_URL }
}

export default function Home({ loaderData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-black text-white">
            <Navbar />

            <main className="w-full h-[calc(100vh-56px)] flex items-center justify-center">
                {/* globe container */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <div className="w-full h-full max-w-none">
                        <Globe />
                    </div>
                </div>

                <RightPanel />
                <BottomPanel />
            </main>
        </div>
    )
}
