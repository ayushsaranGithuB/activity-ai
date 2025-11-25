import React, { useState, useEffect, useRef } from "react";
import {
  processMessage,
  initializeAgent,
  AgentResponse,
  resetConversationContext,
  getSessionId,
  startSession,
} from "../agent/agent";
import { startSessionAndNotify } from "@/utils/sessionNotifier";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetHeader,
} from "@/components/ui/sheet";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, SquareChartGantt, CirclePlus } from "lucide-react";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import { Message } from "@/types";
import { sampleMessages } from "@/db/dummyData/sample-messages";
import clsx from "clsx";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [postLogModalOpen, setPostLogModalOpen] = useState(false);
  const [, setSessionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const postLogTimeoutRef = useRef<number | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAgent();
    loadMessages();
    // adopt existing session if App already started one
    try {
      const makeSessionId = () =>
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      let sid = getSessionId();
      if (!sid) {
        sid = makeSessionId();
        try {
          startSession(sid as string);
        } catch (e) {
          console.error("Error starting session in agent:", e);
        }
      }
      setSessionId(sid);
    } catch {
      console.error("Error reading session id");
    }
  }, []);

  // Listen for global chat-reset events (fired from header/home links)
  useEffect(() => {
    const handler = () => {
      try {
        resetConversationContext();
      } catch {
        console.error("Error resetting conversation context");
      }
      if (postLogTimeoutRef.current) {
        clearTimeout(postLogTimeoutRef.current);
        postLogTimeoutRef.current = null;
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      setPostLogModalOpen(false);
      setMessages([]);
      setInput("");
      setSessionId(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const startHandler = (ev: Event) => {
      const custom = ev as CustomEvent;
      const sid = custom?.detail?.sessionId ?? null;
      setSessionId(sid);
    };

    window.addEventListener("chat-reset", handler as EventListener);
    window.addEventListener("chat-start", startHandler as EventListener);
    return () => {
      window.removeEventListener("chat-reset", handler as EventListener);
      window.removeEventListener("chat-start", startHandler as EventListener);
    };
  }, []);

  // Inactivity timer: clear session and UI after 5 minutes of no user input
  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    inactivityTimeoutRef.current = window.setTimeout(() => {
      try {
        resetConversationContext();
      } catch {
        console.error("Error resetting conversation context");
      }
      window.dispatchEvent(new CustomEvent("chat-reset"));
      setMessages([]);
      setInput("");
      setSessionId(null);
    }, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", () => {
      if (inputRef.current) {
        inputRef.current.style.paddingBottom = "80px";
      }
    });

    Keyboard.addListener("keyboardWillHide", () => {
      if (inputRef.current) {
        inputRef.current.style.paddingBottom = "0px";
      }
    });
  }, []);

  const loadMessages = async () => {
    if (!Capacitor.isNativePlatform()) {
      // load dummy messages
      setMessages(sampleMessages);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await processMessage(userMessage.content);
      const agentMessage: Message = {
        id: Date.now() + 1,
        role: "agent",
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      if ((response as AgentResponse).showPostLogActions) {
        // clear any existing pending timeout
        if (postLogTimeoutRef.current) {
          clearTimeout(postLogTimeoutRef.current);
          postLogTimeoutRef.current = null;
        }
        // open the post-log modal after a 3 second delay
        postLogTimeoutRef.current = window.setTimeout(() => {
          setPostLogModalOpen(true);
          postLogTimeoutRef.current = null;
        }, 3000);
        // Reset the session ID and conversation context
        setSessionId(null);
        resetConversationContext();
      }
      // refresh inactivity timer on each successful send
      resetInactivityTimer();
    } catch (error) {
      console.error("Error processing message:", error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "agent",
        content:
          "Sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewTimeline = () => {
    if (postLogTimeoutRef.current) {
      clearTimeout(postLogTimeoutRef.current);
      postLogTimeoutRef.current = null;
    }
    setPostLogModalOpen(false);
    navigate({ to: "/timeline" });
  };

  const handleLogAnother = () => {
    if (postLogTimeoutRef.current) {
      clearTimeout(postLogTimeoutRef.current);
      postLogTimeoutRef.current = null;
    }
    setPostLogModalOpen(false);
    // Start a fresh session and navigate home. Calling the notifier here
    // ensures the session resets immediately (no reliance on locationchange).
    try {
      startSessionAndNotify();
    } catch (e) {
      console.error("Error starting session from Chat handleLogAnother", e);
    }
    navigate({ to: "/" });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // cleanup any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (postLogTimeoutRef.current) {
        clearTimeout(postLogTimeoutRef.current);
        postLogTimeoutRef.current = null;
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  //  Ai Generated Question Not required now
  // const [aiQuestion, setAIQuestion] = useState("");
  // useEffect(() => {
  //   const fetchAIQuestion = async () => {
  //     const question = await getAIQuestionForTime();
  //     setAIQuestion(question);
  //   };
  //   fetchAIQuestion();
  // }, []);

  return (
    <div className="flex flex-col h-full bg-background flex-1">
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-5 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt="Activity AI" />
                <AvatarFallback>
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-semibold">What are you up to?</h2>
                {/* <p className="text-lg">{aiQuestion}</p> */}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* {message.role === "agent" && (
                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                  <AvatarImage src="" alt="Activity AI" />
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )} */}

              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
                  message.role === "user"
                    ? "bg-neutral-800 text-primary-foreground rounded-xl px-4 py-2 rounded-br-none"
                    : "bg-muted"
                }`}
              >
                <p
                  className={clsx(
                    "whitespace-pre-wrap",
                    message.role === "user" ? "text-sm" : "text-lg"
                  )}
                >
                  {message.content}
                </p>
              </div>

              {/* {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                  <AvatarImage src="" alt="You" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )} */}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                <AvatarImage src="" alt="Activity AI" />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div
        ref={inputRef}
        className=" bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 "
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                name="message-input"
                id="message-input"
                onChange={(e) => {
                  setInput(e.target.value);
                  // any user typing counts as activity — refresh inactivity timer
                  resetInactivityTimer();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Message Activity AI..."
                disabled={isLoading}
                className="min-h-[52px] max-h-[200px] resize-none rounded-2xl border-border/50 bg-muted/50 px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 focus:ring-offset-0 shadow-sm"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Sheet open={postLogModalOpen} onOpenChange={setPostLogModalOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-lg border-t-0"
        >
          <SheetHeader>
            <SheetTitle>Activity logged</SheetTitle>
            <SheetDescription>What would you like to do next?</SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex gap-6 flex-col py-4">
            <Button
              onClick={handleViewTimeline}
              size="sm"
              className="flex-1 border text-xl p-3 rounded-full flex space-x-3 cursor-pointer"
            >
              <SquareChartGantt className="!w-[24px] !h-[24px]" />
              View timeline
            </Button>
            <Button
              onClick={handleLogAnother}
              size="sm"
              className="flex-1 border text-xl p-3 rounded-full flex space-x-3 cursor-pointer"
            >
              <CirclePlus className="!w-[24px] !h-[24px]" />
              Log another Activity
            </Button>
          </div>
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Chat;
