// Sample messages for the web UI
import { Message } from "@/types";

export const sampleMessages: Message[] = [
    {
        id: 1,
        role: "user",
        content: "Went to Lunch",
        timestamp: new Date()
    },
    {
        id: 2,
        role: "agent",
        content: "That sounds like a nice break! What did you eat?",
        timestamp: new Date(Date.now() + 1000)
    },
    {
        id: 3,
        role: "user",
        content: "Chicken Sandwich",
        timestamp: new Date(Date.now() + 2000)
    },
    {
        id: 4,
        role: "agent",
        content: "Yum! I've saved it to the activity log.",
        timestamp: new Date(Date.now() + 3000)
    }
]