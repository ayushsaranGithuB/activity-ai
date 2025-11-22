import React from "react";
import Message from "./Message";

interface MessageItem {
  id: number;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: MessageItem[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
