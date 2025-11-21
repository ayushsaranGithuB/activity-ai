import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { testDatabase } from "../test-db";
import CategoryEvaluation from "./CategoryEvaluation";
import CategoryMigration from "./CategoryMigration";
import "../css/settings.css";

export default function Settings() {
  const [isRecategorizing, setIsRecategorizing] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    console.log("🔄 Settings: showMigration state changed to:", showMigration);
  }, [showMigration]);

  useEffect(() => {
    console.log(
      "📊 Settings: showEvaluation state changed to:",
      showEvaluation
    );
  }, [showEvaluation]);

  const runDatabaseTest = async () => {
    console.clear();
    await testDatabase();
    alert("Database test completed! Check the console for details.");
  };

  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL data? This cannot be undone!"
      )
    )
      return;

    try {
      await storage.clearAllData();
      alert("All data cleared!");
      // Optionally reload the page to refresh all components
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear data:", err);
      alert("Failed to clear data");
    }
  };

  // Backup all IndexedDB data and trigger download
  const backupAllData = async () => {
    try {
      const data = await storage.exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-ai-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("Backup downloaded as JSON file.");
    } catch (err) {
      console.error("Failed to backup data:", err);
      alert("Failed to backup data");
    }
  };

  const recategorizeActivities = async () => {
    if (
      !confirm(
        "This will re-analyze all activities and update their categories. This may take a few moments. Continue?"
      )
    )
      return;

    setIsRecategorizing(true);

    try {
      const activities = await storage.getAllActivities();

      const generalActivities = activities.filter(
        (a) =>
          a.category === "General" ||
          a.category === "Uncategorized" ||
          a.category === "Other"
      );

      console.log(
        `🔄 Recategorizing ${generalActivities.length} activities...`
      );

      let updated = 0;
      let failed = 0;

      const allCategories = await storage.getCategoryNames();
      const goodCategories = allCategories.filter(
        (c) => c !== "General" && c !== "Uncategorized" && c !== "Other"
      );

      for (const activity of generalActivities) {
        const { CATEGORIZE_PROMPT } = await import(
          "../prompts/categorizePrompt"
        );
        const prompt = CATEGORIZE_PROMPT(activity.text, goodCategories, true);
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "";
        if (!apiKey) throw new Error("Gemini API key not set");
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
            apiKey,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 100,
                responseMimeType: "application/json",
              },
            }),
          }
        );
        const llmData = await response.json();
        let newCategory = goodCategories[0] || "General";
        try {
          const result = JSON.parse(
            llmData.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
          );
          if (
            result.subcategory &&
            goodCategories.includes(result.subcategory)
          ) {
            newCategory = result.subcategory;
          }
        } catch {
          // fallback to default
        }
        try {
          // Build Gemini prompt
          const { CATEGORIZE_PROMPT } = await import(
            "../prompts/categorizePrompt"
          );
          const prompt = CATEGORIZE_PROMPT(activity.text, goodCategories, true);
          // Use centralized Gemini LLM function
          const llmResponse = await import("../lib/ai").then((mod) =>
            mod.generateContent(prompt, {
              temperature: 0.3,
              maxOutputTokens: 100,
              responseMimeType: "application/json",
            })
          );
          // Use newCategory from above
          try {
            const result = JSON.parse(llmResponse);
            if (
              result.subcategory &&
              goodCategories.includes(result.subcategory)
            ) {
              newCategory = result.subcategory;
            }
          } catch {
            // fallback to default
          }

          if (
            newCategory &&
            newCategory !== activity.category &&
            newCategory !== "General" &&
            newCategory !== "Uncategorized"
          ) {
            const oldCategory = activity.category;
            activity.category = newCategory;
            await storage.updateActivity(activity);

            const newCat = await storage.getCategory(newCategory);
            if (newCat) {
              newCat.activityCount++;
              newCat.totalMinutes += 30;
              newCat.lastUsedAt = Date.now();
              await storage.addOrUpdateCategory(newCat);
            } else {
              await storage.addOrUpdateCategory({
                name: newCategory,
                totalMinutes: 30,
                activityCount: 1,
                createdAt: Date.now(),
                lastUsedAt: Date.now(),
              });
            }

            const oldCat = await storage.getCategory(oldCategory);
            if (oldCat && oldCat.activityCount > 0) {
              oldCat.activityCount--;
              oldCat.totalMinutes = Math.max(0, oldCat.totalMinutes - 30);
              if (oldCat.activityCount === 0) {
                await storage.deleteCategory(oldCategory);
              } else {
                await storage.addOrUpdateCategory(oldCat);
              }
            }

            updated++;
            console.log(
              `705 "${activity.text}" 192 ${oldCategory} 192 ${newCategory}`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Failed to recategorize activity:`, err);
          failed++;
        }
      }

      console.log(
        `✨ Recategorization complete! Updated: ${updated}, Failed: ${failed}`
      );
      alert(
        `Recategorization complete!\n\nUpdated: ${updated}\nFailed: ${failed}\n\nPage will reload to reflect changes.`
      );
      window.location.reload();
    } catch (err) {
      console.error("Failed to recategorize:", err);
      alert("Failed to recategorize activities");
    } finally {
      setIsRecategorizing(false);
    }
  };

  return (
    <div className="settings">
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>Developer Tools</h3>
        <div className="settings-actions">
          <button onClick={runDatabaseTest} className="btn-secondary">
            Test Database
          </button>
          <button
            onClick={() => setShowEvaluation(!showEvaluation)}
            className={showEvaluation ? "btn-secondary" : "btn-info"}
          >
            {showEvaluation ? "Close Evaluation" : "Evaluate Categories"}
          </button>
          <button
            onClick={() => {
              console.log(
                "🔄 Settings: Migration button clicked. Current state:",
                showMigration
              );
              setShowMigration(!showMigration);
            }}
            className={showMigration ? "btn-secondary" : "btn-success"}
          >
            {showMigration ? "Close Migration" : "Migrate to Broad Categories"}
          </button>
          <button
            onClick={recategorizeActivities}
            className="btn-primary"
            disabled={isRecategorizing}
          >
            {isRecategorizing ? "Recategorizing..." : "Recategorize"}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Data Management</h3>
        <div className="settings-actions">
          <button onClick={clearAllData} className="btn-danger">
            Clear All Data
          </button>
          <button onClick={backupAllData} className="btn-info">
            Backup Data
          </button>
          <button
            onClick={() => {
              if (!confirm("Clear cached summaries for day, week, and month?"))
                return;
              localStorage.removeItem("trends-summary-day");
              localStorage.removeItem("trends-summary-week");
              localStorage.removeItem("trends-summary-month");
              alert("Cached summaries cleared!");
            }}
            className="btn-warning"
          >
            Clear Cached Summaries
          </button>
        </div>
        <p className="settings-warning">
          Warning: Clearing data cannot be undone!
        </p>
      </section>

      {showEvaluation && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEvaluation(false);
          }}
        >
          <div className="modal-content">
            <CategoryEvaluation />
          </div>
        </div>
      )}

      {showMigration && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            console.log("🔄 Settings: Migration modal background clicked");
            if (e.target === e.currentTarget) {
              console.log(
                "🔄 Settings: Closing migration modal (clicked outside)"
              );
              setShowMigration(false);
            }
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => {
              console.log("🔄 Settings: Migration modal content clicked");
              e.stopPropagation();
            }}
          >
            <CategoryMigration />
          </div>
        </div>
      )}
    </div>
  );
}
