import React, { useState, useEffect } from "react";
import { generateContent } from "../lib/ai";
import { buildConversationPrompt } from "../prompts/conversationPrompt";
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
    ) as HTMLTextAreaElement | null;
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
      setExistingCategories([]);
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

    setConversationHistory((prev = []) => [...prev, userMessage]);
    setText("");
    setIsWaitingForResponse(true);
    setError(null);

    // Build prompt for LLM (add stricter JSON instruction)
    const prompt =
      buildConversationPrompt(
        userMessage.content,
        [...conversationHistory, userMessage],
        existingCategories
      ) +
      "\n\nIMPORTANT: Return ONLY valid JSON, no extra text, no comments, no explanations.";

    let responseText;
    try {
      responseText = await generateContent(prompt);
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        console.warn("AI response was not valid JSON:", responseText);
        parsed = {
          assistantMessage: responseText,
          quickOptions: [],
          readyToSave: true,
          activityText: userMessage.content,
          subcategory: existingCategories[0] || "General",
          broadCategory: getBroadCategoryForSubcategory(
            existingCategories[0] || "General"
          ),
        };
        toast.error("AI response was not valid JSON. Showing raw response.");
      }

      // Add assistant message to history
      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: parsed.assistantMessage,
        timestamp: Date.now(),
      };
      setConversationHistory((prev) => [...prev, assistantMsg]);
      setQuickOptions(parsed.quickOptions || []);

      // If ready to save, save the activity
      if (parsed.readyToSave && parsed.activityText) {
        setSaving(true);
        const activityText = parsed.activityText;
        const category =
          parsed.subcategory ||
          parsed.category ||
          existingCategories[0] ||
          "General";
        const broadCategory =
          parsed.broadCategory || getBroadCategoryForSubcategory(category);
        try {
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
              existingCategory.broadCategory = broadCategory;
            }
            await storage.addOrUpdateCategory(existingCategory);
          } else {
            await storage.addOrUpdateCategory({
              name: category,
              broadCategory,
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
        } catch (dbErr) {
          console.error("SQLite/storage error:", dbErr);
          setError(
            "Failed to save activity: Database error (SQLite or storage). Please try again or check device storage permissions."
          );
          setSaving(false);
        }
      }
    } catch (llmErr) {
      console.error("LLM error:", llmErr);
      setError(
        "Failed to process message: LLM service unavailable or returned an error."
      );
      setIsWaitingForResponse(false);
      return;
    }
    setIsWaitingForResponse(false);
  };

  // Handle quick option click
  const handleQuickOption = async (option: string) => {
    setError(null);
    if (isWaitingForResponse || saving) return;
    setIsWaitingForResponse(true);
    let responseText;
    try {
      const prompt =
        buildConversationPrompt(
          option,
          conversationHistory,
          existingCategories
        ) +
        "\n\nIMPORTANT: Return ONLY valid JSON, no extra text, no comments, no explanations.";
      responseText = await generateContent(prompt);
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        console.warn("AI response was not valid JSON:", responseText);
        parsed = {
          assistantMessage: responseText,
          quickOptions: [],
          readyToSave: true,
          activityText: option,
          subcategory: existingCategories[0] || "General",
          broadCategory: getBroadCategoryForSubcategory(
            existingCategories[0] || "General"
          ),
        };
        toast.error("AI response was not valid JSON. Showing raw response.");
      }
      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: parsed.assistantMessage,
        timestamp: Date.now(),
      };
      setConversationHistory((prev) => [...prev, assistantMsg]);
      setQuickOptions(parsed.quickOptions || []);
      if (parsed.readyToSave && parsed.activityText) {
        setSaving(true);
        const activityText = parsed.activityText;
        const category =
          parsed.subcategory ||
          parsed.category ||
          existingCategories[0] ||
          "General";
        const broadCategory =
          parsed.broadCategory || getBroadCategoryForSubcategory(category);
        try {
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
              existingCategory.broadCategory = broadCategory;
            }
            await storage.addOrUpdateCategory(existingCategory);
          } else {
            await storage.addOrUpdateCategory({
              name: category,
              broadCategory,
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
        } catch (dbErr) {
          console.error("SQLite/storage error:", dbErr);
          setError(
            "Failed to save activity: Database error (SQLite or storage). Please try again or check device storage permissions."
          );
          setSaving(false);
        }
      }
    } catch (e) {
      console.error("Error in quick option:", e);
      setError("Failed to process quick option.");
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  // Stub for retry logic (can be implemented to resend failed messages)
  const handleRetry = async (_idx: number) => {
    setError(null);
    if (isWaitingForResponse || saving) return;
    // Find the user message to retry
    const msgToRetry = conversationHistory[_idx];
    if (!msgToRetry || msgToRetry.role !== "user") return;
    setIsWaitingForResponse(true);
    try {
      // Build prompt for LLM
      const prompt =
        buildConversationPrompt(
          msgToRetry.content,
          conversationHistory.slice(0, _idx + 1),
          existingCategories
        ) +
        "\n\nIMPORTANT: Return ONLY valid JSON, no extra text, no comments, no explanations.";
      const responseText = await generateContent(prompt);
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        console.warn("AI response was not valid JSON:", responseText);
        parsed = {
          assistantMessage: responseText,
          quickOptions: [],
          readyToSave: true,
          activityText: msgToRetry.content,
          subcategory: existingCategories[0] || "General",
          broadCategory: getBroadCategoryForSubcategory(
            existingCategories[0] || "General"
          ),
        };
        toast.error("AI response was not valid JSON. Showing raw response.");
      }
      // Add assistant message to history (replace previous assistant message if exists)
      setConversationHistory((prev) => {
        const updated = [...prev];
        // If next message is assistant and has error, replace it
        if (
          updated[_idx + 1] &&
          updated[_idx + 1].role === "assistant" &&
          updated[_idx + 1].error
        ) {
          updated[_idx + 1] = {
            role: "assistant",
            content: parsed.assistantMessage,
            timestamp: Date.now(),
          };
        } else {
          updated.push({
            role: "assistant",
            content: parsed.assistantMessage,
            timestamp: Date.now(),
          });
        }
        return updated;
      });
      setQuickOptions(parsed.quickOptions || []);
      // If ready to save, save the activity
      if (parsed.readyToSave && parsed.activityText) {
        setSaving(true);
        const activityText = parsed.activityText;
        const category =
          parsed.subcategory ||
          parsed.category ||
          existingCategories[0] ||
          "General";
        const broadCategory =
          parsed.broadCategory || getBroadCategoryForSubcategory(category);
        try {
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
              existingCategory.broadCategory = broadCategory;
            }
            await storage.addOrUpdateCategory(existingCategory);
          } else {
            await storage.addOrUpdateCategory({
              name: category,
              broadCategory,
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
        } catch (dbErr) {
          console.error("SQLite/storage error:", dbErr);
          setError(
            "Failed to save activity: Database error (SQLite or storage). Please try again or check device storage permissions."
          );
          setSaving(false);
        }
      }
    } catch (e) {
      console.error("Error in retry:", e);
      setError("Failed to retry message.");
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isWaitingForResponse &&
      !saving &&
      text.trim()
    ) {
      e.preventDefault();
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
            {conversationHistory.map((msg, _idx) => (
              <div
                key={_idx}
                className={`${
                  msg.role === "user" ? "user-message" : "assistant-message"
                } ${msg.error ? "message-error" : ""}`}
              >
                <span className="message-content">{msg.content}</span>
                {msg.error && msg.role === "user" && (
                  <button
                    className="retry-btn"
                    onClick={() => handleRetry(_idx)}
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
          {quickOptions.map((option, _idx) => (
            <button
              key={_idx}
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
        <textarea
          name="user-activity"
          rows={1}
          id="user-activity-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyPress={handleKeyPress}
          placeholder="e.g. I just ate dinner"
          disabled={isWaitingForResponse || saving}
          className="auto-textarea"
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
