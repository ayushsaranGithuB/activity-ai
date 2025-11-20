import React, { useState, useEffect } from "react";
import { Info as InfoIcon, Github, Globe, Heart } from "lucide-react";
import { storage } from "../lib/storage";

export default function Info() {
  const [stats, setStats] = useState({
    firstActivityDate: "N/A",
    lastActivityDate: "N/A",
    totalActivities: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    logLifetime: "N/A",
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const storageStats = await storage.getStats();
      const categories = await storage.getAllCategories();

      // Get unique broad categories from all subcategories
      const broadCategoriesSet = new Set<string>();
      categories.forEach((c) => {
        if (c.broadCategory) {
          broadCategoriesSet.add(c.broadCategory);
        }
      });

      // Count subcategories (categories that are not broad categories themselves)
      const subcategories = categories.filter((c) => !c.isBroadCategory);

      let firstDate = "N/A";
      let lastDate = "N/A";
      let lifetime = "N/A";

      if (storageStats.oldestActivity && storageStats.newestActivity) {
        firstDate = new Date(storageStats.oldestActivity).toLocaleDateString();
        lastDate = new Date(storageStats.newestActivity).toLocaleDateString();

        // Calculate inclusive lifetime
        const msPerDay = 1000 * 60 * 60 * 24;
        const startDay = Math.floor(storageStats.oldestActivity / msPerDay);
        const endDay = Math.floor(storageStats.newestActivity / msPerDay);
        const diffDays = endDay - startDay + 1;
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;

        if (months > 0) {
          lifetime = `${months} month${months > 1 ? "s" : ""}, ${days} day${
            days !== 1 ? "s" : ""
          }`;
        } else if (diffDays > 0) {
          lifetime = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        } else {
          lifetime = "Less than a day";
        }
      }

      setStats({
        firstActivityDate: firstDate,
        lastActivityDate: lastDate,
        totalActivities: storageStats.totalActivities,
        totalCategories: broadCategoriesSet.size,
        totalSubcategories: subcategories.length,
        logLifetime: lifetime,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  return (
    <div className="app-info">
      <h2>
        <InfoIcon
          size={24}
          style={{ marginRight: "8px", verticalAlign: "middle" }}
        />
        App Info
      </h2>

      <section className="settings-section">
        <table style={{ width: "100%", fontSize: "1.3em" }}>
          <tbody>
            <tr>
              <td className="info-label">App Lifetime:</td>
              <td className="info-value">{stats.logLifetime}</td>
            </tr>
            <tr>
              <td className="info-label">First Activity:</td>
              <td className="info-value">{stats.firstActivityDate}</td>
            </tr>
            <tr>
              <td className="info-label">Last Activity:</td>
              <td className="info-value">{stats.lastActivityDate}</td>
            </tr>
            <tr>
              <td className="info-label">Total Activities:</td>
              <td className="info-value">{stats.totalActivities}</td>
            </tr>
            <tr>
              <td className="info-label">Total Categories:</td>
              <td className="info-value">{stats.totalCategories}</td>
            </tr>
            <tr>
              <td className="info-label">Total Subcategories:</td>
              <td className="info-value">{stats.totalSubcategories}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="settings-section align-center">
        <h3>Credits</h3>
        <p>
          Made with <Heart size={16} color="#e74c3c" fill="#e74c3c" /> by Ayush
          S.
        </p>
        <p
          style={{
            fontSize: "0.9em",
            color: "#666",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          © 2024 Activity AI. All rights reserved.
        </p>
      </section>
    </div>
  );
}
