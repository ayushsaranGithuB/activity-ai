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
        content: "That sounds like a nice break! I've logged 'Went to Lunch' under the 'Food' category.",
        timestamp: new Date(Date.now() + 1000)
    },
    {
        id: 3,
        role: "user",
        content: "Worked on the new project feature",
        timestamp: new Date(Date.now() + 2000)
    },
    {
        id: 4,
        role: "agent",
        content: "Great progress! I've categorized 'Worked on the new project feature' as 'Work'.",
        timestamp: new Date(Date.now() + 3000)
    },
    {
        id: 5,
        role: "user",
        content: "Had a meeting with the team",
        timestamp: new Date(Date.now() + 4000)
    },
    {
        id: 6,
        role: "agent",
        content: "Team meetings are important! Logged under 'Work' category.",
        timestamp: new Date(Date.now() + 5000)
    },
    {
        id: 7,
        role: "user",
        content: "Went for a run in the park",
        timestamp: new Date(Date.now() + 6000)
    },
    {
        id: 8,
        role: "agent",
        content: "Exercise is key! I've added 'Went for a run in the park' to 'Physical Activity'.",
        timestamp: new Date(Date.now() + 7000)
    },
    {
        id: 9,
        role: "user",
        content: "Read a book on AI",
        timestamp: new Date(Date.now() + 8000)
    },
    {
        id: 10,
        role: "agent",
        content: "Learning never stops! Categorized as 'Learning & Education'.",
        timestamp: new Date(Date.now() + 9000)
    }
]