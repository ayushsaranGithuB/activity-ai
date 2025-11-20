import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { getBroadCategoryForSubcategory } from "../lib/broad-categories";
import type { Category, BroadCategory } from "../types";

// Map old broad category names to new ones
function updateBroadCategoryName(oldName: string): BroadCategory {
  const mapping: Record<string, BroadCategory> = {
    "Work & Professional": "Work",
    "Food & Nutrition": "Food",
    "Wellness & Self-Care": "Health",
  };
  return (mapping[oldName] as BroadCategory) || (oldName as BroadCategory);
}

export default function CategoryMigration() {
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    console.log("✅ CategoryMigration: Component mounted");

    // Test the getBroadCategoryForSubcategory function
    const testCategories = [
      "App Development",
      "Drinking Beverage",
      "Stretching",
      "Watching TV",
      "Uncategorized",
    ];
    console.log(
      "🧪 CategoryMigration: Testing getBroadCategoryForSubcategory:"
    );
    testCategories.forEach((cat) => {
      const broad = getBroadCategoryForSubcategory(cat);
      console.log(`  "${cat}" → "${broad}"`);
    });

    return () => {
      console.log("❌ CategoryMigration: Component unmounted");
    };
  }, []);

  async function migrateCategories() {
    console.log("🔄 CategoryMigration: migrateCategories called");

    if (
      !confirm(
        "This will analyze all your categories and assign them to broader categories. This is safe and reversible. Continue?"
      )
    ) {
      console.log("❌ CategoryMigration: User cancelled migration");
      return;
    }

    console.log("✅ CategoryMigration: User confirmed, starting migration");
    setMigrating(true);
    setStatus("🔄 Starting migration...\n");
    setProgress("");

    try {
      console.log("📊 CategoryMigration: Fetching all categories from storage");
      const categories = await storage.getAllCategories();
      console.log("✅ CategoryMigration: Retrieved categories:", categories);

      let updatedCount = 0;
      let alreadyMigrated = 0;

      setStatus(
        (prev) => prev + `\nFound ${categories.length} categories to analyze\n`
      );

      for (const category of categories) {
        console.log(
          `🔍 CategoryMigration: Processing category "${category.name}"`,
          {
            current: category,
            hasBroadCategory: !!category.broadCategory,
            isBroadCategory: category.isBroadCategory,
          }
        );

        // Determine broad category (re-assign to handle renamed categories)
        console.log(
          `🎯 CategoryMigration: Determining broad category for "${category.name}"`
        );
        let broadCategory = getBroadCategoryForSubcategory(category.name);

        // If category already has a broad category, update it to new name if needed
        if (category.broadCategory) {
          const updatedName = updateBroadCategoryName(category.broadCategory);
          if (updatedName !== category.broadCategory) {
            console.log(
              `🔄 CategoryMigration: Updating broad category name "${category.broadCategory}" → "${updatedName}"`
            );
            broadCategory = updatedName;
          } else {
            // Keep existing assignment if it's already correct
            broadCategory = category.broadCategory;
          }
        }

        console.log(
          `✅ CategoryMigration: Assigned broad category "${broadCategory}" to "${category.name}"`
        );

        // Update category
        const updatedCategory: Category = {
          ...category,
          broadCategory,
          isBroadCategory: false,
        };

        console.log(
          `💾 CategoryMigration: Saving updated category:`,
          updatedCategory
        );
        await storage.addOrUpdateCategory(updatedCategory);
        console.log(
          `✅ CategoryMigration: Successfully saved "${category.name}"`
        );

        updatedCount++;

        setProgress((prev) => prev + `✓ ${category.name} → ${broadCategory}\n`);

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      console.log(
        `🎉 CategoryMigration: Migration complete! Updated: ${updatedCount}`
      );

      setStatus(
        (prev) =>
          prev +
          `\n✅ Migration complete!\n` +
          `   Updated: ${updatedCount} categories\n`
      );

      setTimeout(() => {
        if (confirm("Migration complete! Reload the page to see changes?")) {
          console.log("🔄 CategoryMigration: Reloading page");
          window.location.reload();
        } else {
          console.log("CategoryMigration: User declined page reload");
        }
      }, 1000);
    } catch (error) {
      console.error("❌ CategoryMigration: Error during migration:", error);
      console.error(
        "Stack trace:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      setStatus((prev) => prev + `\n❌ Error during migration: ${error}\n`);
    } finally {
      console.log("🏁 CategoryMigration: Migration process finished");
      setMigrating(false);
    }
  }

  async function showCurrentStructure() {
    console.log("📊 CategoryMigration: showCurrentStructure called");
    setStatus("📊 Current Category Structure\n\n");
    setProgress("");

    try {
      console.log("📊 CategoryMigration: Fetching all categories");
      const categories = await storage.getAllCategories();
      console.log(
        "✅ CategoryMigration: Retrieved categories for structure view:",
        categories
      );

      // Group by broad category
      const grouped: Map<string, string[]> = new Map();

      for (const category of categories) {
        const broad = category.broadCategory || "Not Yet Assigned";
        console.log(
          `📂 CategoryMigration: Grouping "${category.name}" under "${broad}"`
        );
        if (!grouped.has(broad)) {
          grouped.set(broad, []);
        }
        grouped.get(broad)!.push(category.name);
      }

      console.log(
        "✅ CategoryMigration: Grouped categories:",
        Object.fromEntries(grouped)
      );

      let output = "";
      for (const [broad, subs] of grouped.entries()) {
        output += `\n${broad} (${subs.length})\n`;
        for (const sub of subs) {
          output += `   • ${sub}\n`;
        }
      }

      console.log("✅ CategoryMigration: Structure output generated");
      setProgress(output);
    } catch (error) {
      console.error(
        "❌ CategoryMigration: Error in showCurrentStructure:",
        error
      );
      console.error(
        "Stack trace:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      setStatus((prev) => prev + `\n❌ Error: ${error}\n`);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔄 Category Migration</h2>
      <p>
        This tool migrates your existing categories to the new hierarchical
        structure with broader categories and subcategories.
      </p>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={showCurrentStructure}
          disabled={migrating}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            marginRight: "10px",
            cursor: migrating ? "not-allowed" : "pointer",
          }}
        >
          📊 Show Current Structure
        </button>

        <button
          onClick={migrateCategories}
          disabled={migrating}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: migrating ? "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: migrating ? "not-allowed" : "pointer",
          }}
        >
          {migrating ? "🔄 Migrating..." : "▶ Start Migration"}
        </button>
      </div>

      {status && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            borderRadius: "8px",
            fontFamily: "Consolas, Monaco, monospace",
            fontSize: "14px",
            whiteSpace: "pre-wrap",
          }}
        >
          {status}
        </div>
      )}

      {progress && (
        <div
          style={{
            marginTop: "10px",
            padding: "15px",
            backgroundColor: "#2d2d2d",
            color: "#4ec9b0",
            borderRadius: "8px",
            fontFamily: "Consolas, Monaco, monospace",
            fontSize: "13px",
            maxHeight: "400px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {progress}
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#856404" }}>
          ℹ️ What This Does
        </h3>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "#856404" }}>
          <li>Analyzes each of your existing categories</li>
          <li>Assigns them to appropriate broader categories</li>
          <li>Maintains all your activity data and time tracking</li>
          <li>Creates a hierarchical structure for better organization</li>
          <li>Safe and reversible - no data is deleted</li>
        </ul>
      </div>
    </div>
  );
}
