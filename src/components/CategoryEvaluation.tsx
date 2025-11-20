import React, { useState } from "react";
import { storage } from "../lib/storage";
import type { Category } from "../types";

interface CategoryRecommendation {
  broadCategory: string;
  subcategories: string[];
  reasoning: string;
}

export default function CategoryEvaluation() {
  const [evaluation, setEvaluation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function evaluateCategories() {
    setLoading(true);
    let output = "📊 EVALUATING CURRENT CATEGORIES IN DATABASE\n";
    output += "=".repeat(60) + "\n\n";

    try {
      const categories = await storage.getAllCategories();
      const activities = await storage.getAllActivities();

      output += `📈 OVERVIEW\n`;
      output += `   Total Categories: ${categories.length}\n`;
      output += `   Total Activities: ${activities.length}\n\n`;
      output += "=".repeat(60) + "\n\n";

      if (categories.length === 0) {
        output += "⚠️  No categories found in database\n";
        output += "   The database appears to be empty or not initialized.\n";
        setEvaluation(output);
        setLoading(false);
        return;
      }

      // Sort categories by activity count
      const sortedCategories = [...categories].sort(
        (a, b) => b.activityCount - a.activityCount
      );

      output += `📋 CURRENT CATEGORIES (sorted by usage)\n\n`;

      sortedCategories.forEach((cat, index) => {
        const avgMinutesPerActivity =
          cat.activityCount > 0
            ? (cat.totalMinutes / cat.activityCount).toFixed(1)
            : "0";

        const lastUsed = new Date(cat.lastUsedAt).toLocaleDateString();
        const created = new Date(cat.createdAt).toLocaleDateString();

        output += `${index + 1}. ${cat.name}\n`;
        output += `   └─ Activities: ${cat.activityCount}\n`;
        output += `   └─ Total Time: ${cat.totalMinutes} minutes (${(
          cat.totalMinutes / 60
        ).toFixed(1)} hours)\n`;
        output += `   └─ Avg Time/Activity: ${avgMinutesPerActivity} minutes\n`;
        output += `   └─ Last Used: ${lastUsed}\n`;
        output += `   └─ Created: ${created}\n\n`;
      });

      output += "=".repeat(60) + "\n\n";
      output += "🔍 CATEGORY ANALYSIS\n\n";

      // Find potential duplicates
      const potentialDuplicates: string[] = [];
      for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
          const name1 = categories[i].name.toLowerCase();
          const name2 = categories[j].name.toLowerCase();

          if (name1.includes(name2) || name2.includes(name1)) {
            potentialDuplicates.push(
              `"${categories[i].name}" ↔ "${categories[j].name}"`
            );
          }
        }
      }

      if (potentialDuplicates.length > 0) {
        output += "⚠️  Potential Similar/Duplicate Categories:\n";
        potentialDuplicates.forEach((dup) => (output += `   • ${dup}\n`));
        output += "\n";
      } else {
        output += "✓ No obvious duplicate categories detected\n\n";
      }

      // Time distribution
      const totalTime = categories.reduce(
        (sum, cat) => sum + cat.totalMinutes,
        0
      );
      output += "📊 TIME DISTRIBUTION:\n";
      output += `   Total Time Tracked: ${totalTime} minutes (${(
        totalTime / 60
      ).toFixed(1)} hours)\n\n`;

      const topCategories = sortedCategories.slice(0, 5);
      output += "   Top 5 Categories by Time:\n";
      topCategories.forEach((cat, idx) => {
        const percentage =
          totalTime > 0 ? ((cat.totalMinutes / totalTime) * 100).toFixed(1) : 0;
        output += `   ${idx + 1}. ${cat.name}: ${
          cat.totalMinutes
        } min (${percentage}%)\n`;
      });

      output += "\n" + "=".repeat(60) + "\n\n";
      output += "📝 SAMPLE ACTIVITIES BY CATEGORY\n\n";

      // Sample activities
      for (const cat of topCategories.slice(0, 3)) {
        const catActivities = activities.filter((a) => a.category === cat.name);
        output += `${cat.name} (${catActivities.length} activities):\n`;

        const samples = catActivities.slice(0, 3);
        samples.forEach((act) => {
          output += `   • ${act.text}\n`;
        });

        if (catActivities.length > 3) {
          output += `   ... and ${catActivities.length - 3} more\n`;
        }
        output += "\n";
      }

      output += "=".repeat(60) + "\n\n";
      output += "💡 RECOMMENDATIONS FOR BROADER CATEGORIES\n\n";

      // Analyze for broader categories
      const recommendations = analyzeForBroaderCategories(categories);
      recommendations.forEach((rec) => {
        output += `${rec.broadCategory}:\n`;
        output += `   Potential subcategories: ${rec.subcategories.join(
          ", "
        )}\n`;
        output += `   Reasoning: ${rec.reasoning}\n\n`;
      });

      output += "=".repeat(60) + "\n";
      output += "\n✅ Evaluation complete!\n";

      setEvaluation(output);
    } catch (error) {
      output += `❌ Error evaluating categories: ${error}\n`;
      setEvaluation(output);
    }

    setLoading(false);
  }

  function analyzeForBroaderCategories(
    categories: Category[]
  ): CategoryRecommendation[] {
    const recommendations: CategoryRecommendation[] = [];
    const categoryNames = categories.map((c) => c.name);

    const patterns = [
      {
        broad: "Physical Activity",
        keywords: [
          "exercise",
          "running",
          "gym",
          "workout",
          "walking",
          "cycling",
          "swimming",
          "yoga",
          "sports",
        ],
        reasoning:
          "Physical activities and exercise should be grouped together",
      },
      {
        broad: "Food & Nutrition",
        keywords: [
          "meal",
          "breakfast",
          "lunch",
          "dinner",
          "eating",
          "cooking",
          "food",
          "snack",
        ],
        reasoning: "All eating and food preparation activities",
      },
      {
        broad: "Work & Professional",
        keywords: [
          "work",
          "meeting",
          "project",
          "office",
          "business",
          "coding",
          "programming",
        ],
        reasoning: "Professional and work-related activities",
      },
      {
        broad: "Entertainment & Leisure",
        keywords: [
          "movie",
          "tv",
          "gaming",
          "entertainment",
          "watching",
          "playing",
        ],
        reasoning: "Recreational and entertainment activities",
      },
      {
        broad: "Social & Relationships",
        keywords: [
          "social",
          "friend",
          "family",
          "date",
          "hangout",
          "coffee",
          "chat",
        ],
        reasoning: "Social interactions and relationship building",
      },
      {
        broad: "Learning & Education",
        keywords: [
          "study",
          "reading",
          "learning",
          "course",
          "book",
          "research",
        ],
        reasoning: "Educational and self-improvement activities",
      },
      {
        broad: "Home & Household",
        keywords: [
          "cleaning",
          "chore",
          "household",
          "laundry",
          "organizing",
          "home",
        ],
        reasoning: "Home maintenance and household tasks",
      },
    ];

    patterns.forEach((pattern) => {
      const matches = categoryNames.filter((name) =>
        pattern.keywords.some((keyword) => name.toLowerCase().includes(keyword))
      );

      if (matches.length > 0) {
        recommendations.push({
          broadCategory: pattern.broad,
          subcategories: matches,
          reasoning: pattern.reasoning,
        });
      }
    });

    // Find unmatched categories
    const matchedCategories = new Set(
      recommendations.flatMap((rec) => rec.subcategories)
    );

    const unmatchedCategories = categoryNames.filter(
      (name) => !matchedCategories.has(name)
    );

    if (unmatchedCategories.length > 0) {
      recommendations.push({
        broadCategory: "Other Activities",
        subcategories: unmatchedCategories,
        reasoning:
          "Categories that don't fit common patterns - may need custom broad categories",
      });
    }

    return recommendations;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(evaluation);
    alert("Evaluation copied to clipboard!");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Category Evaluation</h2>
      <p>
        This tool analyzes your current categories and provides recommendations
        for organizing them into broader categories with subcategories.
      </p>

      <button
        onClick={evaluateCategories}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "Evaluating..." : "Evaluate Categories"}
      </button>

      {evaluation && (
        <>
          <button
            onClick={copyToClipboard}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginLeft: "10px",
              marginBottom: "20px",
            }}
          >
            📋 Copy to Clipboard
          </button>
          <pre
            style={{
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: "20px",
              borderRadius: "8px",
              overflow: "auto",
              maxHeight: "600px",
              fontSize: "14px",
              fontFamily: "Consolas, Monaco, monospace",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {evaluation}
          </pre>
        </>
      )}
    </div>
  );
}
