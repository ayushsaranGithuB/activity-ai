import React from "react";
import Chat from "./screens/Chat";
import { Toaster } from "react-hot-toast";
import { CircleDotDashed } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col">
      <Toaster position="bottom-right" />

      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <CircleDotDashed className="h-6 w-6 text-primary" />
            <span className="font-semibold">Activity AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Chat />
      </main>
    </div>
  );
}
