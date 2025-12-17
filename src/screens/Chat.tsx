import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { storage, dbInsert } from "@/agent/tools";
import { Capacitor } from "@capacitor/core";
import { CategoryItem } from "@/types/categoryItem";
interface CategoryOption {
  id: number;
  name: string;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [datetime, setDatetime] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [lengthMins, setLengthMins] = useState<number | "">(30);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmptyDescription, setIsEmptyDescription] = useState(false);

  const dayOfWeek = React.useMemo(() => {
    try {
      const d = new Date(datetime);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, { weekday: "long" });
    } catch {
      return "";
    }
  }, [datetime]);

  const datetimeInputRef = useRef<HTMLInputElement | null>(null);

  const openDatetimePicker = () => {
    const el = datetimeInputRef.current;
    if (!el) return;
    try {
      // Prefer the showPicker API when available
      if (typeof (el as HTMLInputElement).showPicker === "function") {
        (el as HTMLInputElement).showPicker();
        return;
      }
    } catch (e) {
      console.warn("showPicker() failed:", e);
    }
    // Fallback: focus and click the hidden input
    try {
      el.focus();
      el.click();
    } catch (e) {
      console.warn("Focusing/clicking datetime input failed:", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const rows = (await storage.getAllCategories()) as
          | CategoryItem[]
          | undefined;
        const opts = Array.isArray(rows)
          ? rows.map((r: CategoryItem, idx: number) => ({
              id: r.id ?? idx + 1,
              name: r.name,
            }))
          : [];
        setCategories(opts);
        if (opts.length) setCategoryId(opts[0].id ?? null);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    })();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!description.trim()) {
      setIsEmptyDescription(true);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        description: description.trim(),
        category_id: categoryId ?? null,
        length_mins: typeof lengthMins === "number" ? lengthMins : null,
        sub_category: null,
        timestamp: new Date(datetime).toISOString(),
      } as Record<string, unknown>;

      if (Capacitor.isNativePlatform()) {
        await dbInsert("activities", payload);
      } else {
        // Web: log to console (dev fallback)
        console.log("Create activity (web):", payload);
      }

      // Reset form fields on successful save
      setDescription("");
      setLengthMins(30);
      setDatetime(new Date().toISOString().slice(0, 16));
      setCategoryId(categories?.[0]?.id ?? null);

      navigate({ to: "/timeline" });
    } catch (err) {
      console.error("Error saving activity:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Log Activity</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Activity</label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setIsEmptyDescription(false);
            }}
            placeholder="What did you do?"
            rows={3}
            className="w-full"
          />
          {isEmptyDescription && (
            <p className="text-red-300 text-sm mt-2">
              {description.trim() === "" && "Add a description"}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-md border px-3 py-2 bg-black"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id ?? ""}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-25">
            <label className="block text-sm font-medium mb-1">
              Length (mins)
            </label>
            <input
              type="number"
              min={0}
              value={typeof lengthMins === "number" ? lengthMins : ""}
              onChange={(e) =>
                setLengthMins(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">When</label>
          <input
            ref={datetimeInputRef}
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="hidden"
          />
          <p
            onClick={openDatetimePicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDatetimePicker();
              }
            }}
            className="w-full rounded-md border px-3 py-2 cursor-pointer"
          >
            {dayOfWeek +
              " - " +
              Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(datetime))}
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} variant="outline">
            {isSaving ? "Saving…" : "Save Activity"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
