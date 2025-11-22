import React, { useState, useEffect, useRef } from "react";
import { processMessage, initializeAgent } from "../agent/agent";
import MessageList from "@/components/MessageList";
import Input from "@/components/Input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgent();
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    // Load messages from DB
    // For now, start empty
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await processMessage(content);
      const agentMessage: Message = {
        id: Date.now() + 1,
        role: "agent",
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ScrollArea className="flex-1 p-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </ScrollArea>
      <Input onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default Chat;
