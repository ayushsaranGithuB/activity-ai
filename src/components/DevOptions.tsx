import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { testDatabase } from "../test-db";
import CategoryEvaluation from "./CategoryEvaluation";
import CategoryMigration from "./CategoryMigration";

export default function DevOptions() {
  const [isRecategorizing, setIsRecategorizing] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    console.log(
      "🔄 DevOptions: showMigration state changed to:",
      showMigration
    );
  }, [showMigration]);

  useEffect(() => {
    console.log(
      "📊 DevOptions: showEvaluation state changed to:",
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

      // Focus on activities with generic categories that need better classification
      // TODO: In the future, this could run as a weekly background job
      // - Could be triggered via a service worker or scheduled task
      // - Should run during low-usage periods (e.g., 3am local time)
      // - Could batch process activities added in the last week
      // - Should maintain a log of recategorization changes
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

      // Get all existing categories (excluding generic ones)
      const allCategories = await storage.getCategoryNames();
      const goodCategories = allCategories.filter(
        (c) => c !== "General" && c !== "Uncategorized" && c !== "Other"
      );

      // Process activities in batches to avoid overwhelming the API
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

          // Only update if we got a better category
          if (
            newCategory &&
            newCategory !== activity.category &&
            newCategory !== "General" &&
            newCategory !== "Uncategorized"
          ) {
            const oldCategory = activity.category;
            activity.category = newCategory;
            await storage.updateActivity(activity);

            // Update category counts
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

            // Decrease old category count
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

          // Small delay to avoid rate limiting
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
    <>
      <div className="devOptions">
        <button onClick={runDatabaseTest} style={{ fontSize: "12px" }}>
          🧪 Test Database
        </button>
        <button
          onClick={() => setShowEvaluation(!showEvaluation)}
          style={{
            fontSize: "12px",
            background: showEvaluation ? "#6c757d" : "#17a2b8",
            color: "white",
          }}
        >
          {showEvaluation ? "✖ Close Evaluation" : "📊 Evaluate Categories"}
        </button>
        <button
          onClick={() => {
            console.log(
              "🔄 DevOptions: Migration button clicked. Current state:",
              showMigration
            );
            console.log(
              "🔄 DevOptions: Toggling showMigration to:",
              !showMigration
            );
            setShowMigration(!showMigration);
          }}
          style={{
            fontSize: "12px",
            background: showMigration ? "#6c757d" : "#28a745",
            color: "white",
          }}
        >
          {showMigration
            ? "✖ Close Migration"
            : "🔄 Migrate to Broad Categories"}
        </button>
        <button
          onClick={recategorizeActivities}
          style={{
            fontSize: "12px",
            background: isRecategorizing ? "#6c757d" : "#4db59a",
            color: "white",
          }}
          disabled={isRecategorizing}
        >
          {isRecategorizing ? "🔄 Recategorizing..." : "🏷️ Recategorize"}
        </button>
        <button
          onClick={clearAllData}
          style={{ fontSize: "12px", background: "#dc3545", color: "white" }}
        >
          🗑️ Clear All Data
        </button>
      </div>

      {showEvaluation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 9999,
            overflow: "auto",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEvaluation(false);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              maxWidth: "1200px",
              margin: "0 auto",
              borderRadius: "8px",
            }}
          >
            <CategoryEvaluation />
          </div>
        </div>
      )}

      {showMigration && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 9999,
            overflow: "auto",
            padding: "20px",
          }}
          onClick={(e) => {
            console.log("🔄 DevOptions: Migration modal background clicked");
            if (e.target === e.currentTarget) {
              console.log(
                "🔄 DevOptions: Closing migration modal (clicked outside)"
              );
              setShowMigration(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              maxWidth: "1200px",
              margin: "0 auto",
              borderRadius: "8px",
            }}
            onClick={(e) => {
              console.log("🔄 DevOptions: Migration modal content clicked");
              e.stopPropagation();
            }}
          >
            <CategoryMigration />
          </div>
        </div>
      )}
    </>
  );
}
