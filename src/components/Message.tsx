import React from "react";
import { Card } from "@/components/ui/card";

interface Message {
  id: number;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

interface MessageProps {
  message: Message;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <Card
        className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
          isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
        }`}
      >
        <div className="text-sm">{message.content}</div>
        <div className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </Card>
    </div>
  );
};

export default Message;
