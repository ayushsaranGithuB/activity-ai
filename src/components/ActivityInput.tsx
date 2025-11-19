import React, { useState } from "react";

export default function ActivityInput() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      alert("Category: " + data.category);
    } catch (e) {
      console.error(e);
      alert("Failed to contact AI API. Check if the server is running.");
    } finally {
      setSaving(false);
      setText("");
    }
  };

  return (
    <div>
      <h2>What are you up to?</h2>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Making breakfast"
      />
      <button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
