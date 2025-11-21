import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { getBroadCategoryForSubcategory } from "../lib/broad-categories";
import { CircleDotDashed, Send, RotateCcw } from "lucide-react";
import type { ConversationMessage } from "../types";
import toast from "react-hot-toast";

interface InputProps {
  resetKey?: number;
}

export default function Input({ resetKey }: InputProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [quickOptions, setQuickOptions] = useState<string[]>([]);

  // Initialize storage and load existing categories
  useEffect(() => {
    const init = async () => {
      try {
        await storage.init();
        const categories = await storage.getCategoryNames();
        setExistingCategories(categories);
      } catch (err) {
        console.error("Failed to initialize storage:", err);
      }
    };
    init();
    // set focus to input field on mount
    const inputElement = document.getElementById(
      "user-activity-input"
    ) as HTMLInputElement | null;
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  // Reset conversation when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      setConversationHistory([]);
      setQuickOptions([]);
      setText("");
      setError(null);
    }
  }, [resetKey]);

  const handleConversation = async () => {
    if (!text.trim()) return;

    // Add user message to history
    const userMessage: ConversationMessage = {
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    setConversationHistory((prev) => [...prev, userMessage]);
    setText("");
    setIsWaitingForResponse(true);
    setError(null);

    try {
      console.log("📤 Sending request to /api/conversation", {
        userMessage: userMessage.content,
        historyLength: conversationHistory.length,
      });

      // Call conversation API
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage.content,
          conversationHistory: conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          existingCategories,
        }),
      });

      console.log("📥 Response received", { status: res.status });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();

      // Add assistant message to history
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: data.assistantMessage,
        timestamp: Date.now(),
      };

      setConversationHistory((prev) => [...prev, assistantMessage]);

      // Set quick options if provided
      if (data.quickOptions && Array.isArray(data.quickOptions)) {
        setQuickOptions(data.quickOptions);
      } else {
        setQuickOptions([]);
      }

      // If ready to save, save the activity
      if (data.readyToSave && data.activityToSave) {
        setSaving(true);

        const {
          text: activityText,
          category,
          broadCategory,
        } = data.activityToSave;

        // Save to IndexedDB
        await storage.addActivity({
          text: activityText,
          category,
          createdAt: Date.now(),
        });

        // Update or create category with broad category
        const existingCategory = await storage.getCategory(category);
        if (existingCategory) {
          existingCategory.activityCount++;
          existingCategory.totalMinutes += 30; // Default 30 min
          existingCategory.lastUsedAt = Date.now();
          // Ensure broad category is set
          if (!existingCategory.broadCategory) {
            existingCategory.broadCategory =
              broadCategory || getBroadCategoryForSubcategory(category);
          }
          await storage.addOrUpdateCategory(existingCategory);
        } else {
          await storage.addOrUpdateCategory({
            name: category,
            broadCategory:
              broadCategory || getBroadCategoryForSubcategory(category),
            isBroadCategory: false,
            activityCount: 1,
            totalMinutes: 30,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
          });
        }

        // Show success toast
        toast.success(`Saved: ${activityText}`);

        // Reload categories
        const categories = await storage.getCategoryNames();
        setExistingCategories(categories);

        setSaving(false);
        setQuickOptions([]); // Clear options after saving
      }
    } catch (e) {
      console.error("Error in conversation:", e);
      // Mark the last user message as failed
      setConversationHistory((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.role === "user"
            ? { ...msg, error: true }
            : msg
        )
      );
      setError(
        "Failed to process message. Make sure the server is running on port 3000."
      );
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleQuickOption = (option: string) => {
    if (option === "Other...") {
      // Clear options and let user type
      setQuickOptions([]);
      const inputElement = document.getElementById(
        "user-activity-input"
      ) as HTMLInputElement | null;
      if (inputElement) {
        inputElement.focus();
      }
    } else {
      // Use the selected option as the user's response
      setQuickOptions([]); // Clear options
      setText("");

      // Add user message to history
      const userMessage: ConversationMessage = {
        role: "user",
        content: option,
        timestamp: Date.now(),
      };

      setConversationHistory((prev) => [...prev, userMessage]);
      setIsWaitingForResponse(true);
      setError(null);

      // Send to API
      (async () => {
        try {
          const res = await fetch("/api/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userMessage: option,
              conversationHistory: conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              existingCategories,
            }),
          });

          if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
          }

          const data = await res.json();

          // Add assistant message to history
          const assistantMessage: ConversationMessage = {
            role: "assistant",
            content: data.assistantMessage,
            timestamp: Date.now(),
          };

          setConversationHistory((prev) => [...prev, assistantMessage]);

          // Set quick options if provided
          if (data.quickOptions && Array.isArray(data.quickOptions)) {
            setQuickOptions(data.quickOptions);
          } else {
            setQuickOptions([]);
          }

          // If ready to save, save the activity
          if (data.readyToSave && data.activityToSave) {
            setSaving(true);

            const {
              text: activityText,
              category,
              broadCategory,
            } = data.activityToSave;

            // Save to IndexedDB
            await storage.addActivity({
              text: activityText,
              category,
              createdAt: Date.now(),
            });

            // Update or create category with broad category
            const existingCategory = await storage.getCategory(category);
            if (existingCategory) {
              existingCategory.activityCount++;
              existingCategory.totalMinutes += 30;
              existingCategory.lastUsedAt = Date.now();
              // Ensure broad category is set
              if (!existingCategory.broadCategory) {
                existingCategory.broadCategory =
                  broadCategory || getBroadCategoryForSubcategory(category);
              }
              await storage.addOrUpdateCategory(existingCategory);
            } else {
              await storage.addOrUpdateCategory({
                name: category,
                broadCategory:
                  broadCategory || getBroadCategoryForSubcategory(category),
                isBroadCategory: false,
                activityCount: 1,
                totalMinutes: 30,
                createdAt: Date.now(),
                lastUsedAt: Date.now(),
              });
            }

            toast.success(`Saved: ${activityText}`);

            const categories = await storage.getCategoryNames();
            setExistingCategories(categories);

            setSaving(false);
            setQuickOptions([]);
          }
        } catch (e) {
          console.error("Error in conversation:", e);
          // Mark the last user message as failed
          setConversationHistory((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === "user"
                ? { ...msg, error: true }
                : msg
            )
          );
          setError(
            "Failed to process message. Make sure the server is running on port 3000."
          );
        } finally {
          setIsWaitingForResponse(false);
        }
      })();
    }
  };

  const handleRetry = async (messageIndex: number) => {
    const failedMessage = conversationHistory[messageIndex];
    if (!failedMessage || failedMessage.role !== "user" || !failedMessage.error)
      return;

    // Remove error flag and retry
    const updatedHistory = conversationHistory.map((msg, idx) =>
      idx === messageIndex ? { ...msg, error: false } : msg
    );
    setConversationHistory(updatedHistory);
    setIsWaitingForResponse(true);
    setError(null);

    try {
      const historyBeforeRetry = updatedHistory.slice(0, messageIndex);
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: failedMessage.content,
          conversationHistory: historyBeforeRetry.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          existingCategories,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: data.assistantMessage,
        timestamp: Date.now(),
      };

      // Remove any messages after the retried message and add the new response
      setConversationHistory([
        ...updatedHistory.slice(0, messageIndex + 1),
        assistantMessage,
      ]);

      if (data.quickOptions && Array.isArray(data.quickOptions)) {
        setQuickOptions(data.quickOptions);
      } else {
        setQuickOptions([]);
      }

      if (data.readyToSave && data.activityToSave) {
        setSaving(true);

        const {
          text: activityText,
          category,
          broadCategory,
        } = data.activityToSave;

        await storage.addActivity({
          text: activityText,
          category,
          createdAt: Date.now(),
        });

        const existingCategory = await storage.getCategory(category);
        if (existingCategory) {
          existingCategory.activityCount++;
          existingCategory.totalMinutes += 30;
          existingCategory.lastUsedAt = Date.now();
          if (!existingCategory.broadCategory) {
            existingCategory.broadCategory =
              broadCategory || getBroadCategoryForSubcategory(category);
          }
          await storage.addOrUpdateCategory(existingCategory);
        } else {
          await storage.addOrUpdateCategory({
            name: category,
            broadCategory:
              broadCategory || getBroadCategoryForSubcategory(category),
            isBroadCategory: false,
            activityCount: 1,
            totalMinutes: 30,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
          });
        }

        toast.success(`Saved: ${activityText}`);

        const categories = await storage.getCategoryNames();
        setExistingCategories(categories);

        setSaving(false);
        setQuickOptions([]);
      }
    } catch (e) {
      console.error("Error retrying message:", e);
      setConversationHistory((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, error: true } : msg
        )
      );
      setError(
        "Failed to process message. Make sure the server is running on port 3000."
      );
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isWaitingForResponse && !saving && text.trim()) {
      handleConversation();
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="messages">
        {conversationHistory.length === 0 ? (
          <>
            <div className="logo">
              <CircleDotDashed size={24} color="rgba(85, 198, 169, 1)" />
            </div>
            <h2 className="system-prompt">What are you up to?</h2>
          </>
        ) : (
          <div className="conversation">
            {conversationHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === "user" ? "user-message" : "assistant-message"
                } ${msg.error ? "message-error" : ""}`}
              >
                <span className="message-content">{msg.content}</span>
                {msg.error && msg.role === "user" && (
                  <button
                    className="retry-btn"
                    onClick={() => handleRetry(idx)}
                    disabled={isWaitingForResponse || saving}
                    title="Retry message"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>
      {quickOptions.length > 0 && (
        <div className="quick-options">
          {quickOptions.map((option, idx) => (
            <button
              key={idx}
              className="quick-option-btn"
              onClick={() => handleQuickOption(option)}
              disabled={isWaitingForResponse || saving}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <div className="input-section">
        <input
          name="user-activity"
          id="user-activity-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g. I just ate dinner"
          disabled={isWaitingForResponse || saving}
        />
        <button
          onClick={handleConversation}
          disabled={isWaitingForResponse || saving || !text.trim()}
        >
          {isWaitingForResponse || saving ? "..." : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
