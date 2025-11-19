import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { CircleDotDashed } from "lucide-react";

export default function Input() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

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

  const save = async () => {
    if (!text.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Get category from AI
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, existingCategories }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const category = data.category;

      // Save to IndexedDB
      const activity = await storage.addActivity({
        text: text.trim(),
        category,
        createdAt: Date.now(),
      });

      // Update or create category
      const existingCategory = await storage.getCategory(category);
      if (existingCategory) {
        existingCategory.activityCount++;
        existingCategory.totalMinutes += 30; // Default 30 min
        existingCategory.lastUsedAt = Date.now();
        await storage.addOrUpdateCategory(existingCategory);
      } else {
        await storage.addOrUpdateCategory({
          name: category,
          activityCount: 1,
          totalMinutes: 30,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        });
      }

      setSuccess(`Activity saved! Category: ${category} (ID: ${activity.id})`);
      setText("");

      // Reload categories in case a new one was created
      const categories = await storage.getCategoryNames();
      setExistingCategories(categories);
    } catch (e) {
      console.error("Error saving activity:", e);
      setError(
        "Failed to save activity. Make sure the server is running on port 3000."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !saving && text.trim()) {
      save();
    }
  };

  return (
    <div className="input-component">
      <div className="logo">
        <CircleDotDashed size={24} color="rgba(85, 198, 169, 1)" />
      </div>
      <h2 className="system-prompt">What are you up to?</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="input-section">
        <input
          name="user-activity"
          id="user-activity-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g. Making breakfast"
          disabled={saving}
        />
        <button onClick={save} disabled={saving || !text.trim()}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
