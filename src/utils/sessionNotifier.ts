import { resetConversationContext, startNewSession } from "@/agent/agent";

export function startSessionAndNotify(): string | null {
    try {
        // clear any previous context
        try {
            resetConversationContext();
        } catch (e) {
            console.error("sessionNotifier: failed to reset context", e);
        }

        const sid = startNewSession();
        if (sid) {
            try {
                window.dispatchEvent(new CustomEvent("chat-start", { detail: { sessionId: sid } }));
            } catch (e) {
                console.error("sessionNotifier: failed to dispatch chat-start", e);
            }
            try {
                window.dispatchEvent(new CustomEvent("chat-reset"));
            } catch (e) {
                console.error("sessionNotifier: failed to dispatch chat-reset", e);
            }
        }

        return sid;
    } catch (e) {
        console.error("sessionNotifier: failed to start session and notify", e);
        return null;
    }
}
