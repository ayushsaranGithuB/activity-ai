import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { storage } from "@/agent/tools";

interface CategoryOption {
  id: number;
  name: string;
}

interface EditModalProps {
  open: boolean;
  description: string;
  timestamp: string;
  lengthMins?: number;
  selectedCategoryId?: number | undefined;
  onDescriptionChange: (desc: string) => void;
  onTimestampChange: (ts: string) => void;
  onLengthChange?: (mins: number) => void;
  onCategoryChange?: (id: number | undefined) => void;
  onCancel: () => void;
  onSave: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  description,
  timestamp,
  lengthMins,
  selectedCategoryId,
  onLengthChange,
  onDescriptionChange,
  onTimestampChange,
  onCategoryChange,
  onCancel,
  onSave,
}) => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const rows: any = await storage.getAllCategories();
        if (!mounted) return;
        const opts = (rows || []).map((r: any) => ({ id: r.id, name: r.name }));
        setCategories(opts);
      } catch (e) {
        console.warn("Failed to load categories for EditModal", e);
      }
    }
    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-black p-6 rounded shadow-lg min-w-[320px]">
        <h3 className="text-lg font-bold mb-4">Edit Activity</h3>
        <label className="block mb-2">Description:</label>
        <textarea
          className="w-full border px-2 py-1 mb-4"
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />

        <label className="block mb-2">Category:</label>
        <select
          className="w-full border px-2 py-1 mb-4 bg-transparent"
          value={selectedCategoryId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              onCategoryChange?.(undefined);
            } else {
              onCategoryChange?.(Number(val));
            }
          }}
        >
          <option value="">Unassigned</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="block mb-2">Time:</label>
        <input
          type="datetime-local"
          className="w-full border px-2 py-1 mb-4"
          value={timestamp}
          onChange={(e) => onTimestampChange(e.target.value)}
        />
        <label className="block mb-2">Duration (minutes):</label>
        <input
          type="number"
          min={0}
          className="w-full border px-2 py-1 mb-4"
          value={lengthMins ?? ""}
          onChange={(e) => onLengthChange?.(Number(e.target.value))}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
