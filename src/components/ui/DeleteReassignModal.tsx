import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { storage } from "@/agent/tools";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import type { CategoryItem } from "@/types/categoryItem";

type Props = {
  open: boolean;
  onClose: () => void;
  categoryToDelete?: CategoryItem | null;
  categories: CategoryItem[]; // all categories
  onConfirm: (targetId: number) => Promise<void> | void;
};

const DeleteReassignModal: React.FC<Props> = ({
  open,
  onClose,
  categoryToDelete,
  categories,
  onConfirm,
}) => {
  const [targetId, setTargetId] = useState<number | null>(null);

  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    // fetch count of activities to be reassigned
    (async () => {
      if (!categoryToDelete) return;
      const res = await storage.countActivitiesByCategory(categoryToDelete.id);
      if (res?.success) setCount(res.count || 0);
    })();
  }, [open, categoryToDelete]);

  const handleConfirm = async () => {
    if (!targetId) {
      toast.error("Please pick a category to reassign activities to.");
      return;
    }
    await onConfirm(targetId);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="max-w-md">
        <SheetHeader>
          <SheetTitle>Delete Category</SheetTitle>
          <SheetDescription>
            Reassign activities before deleting the category.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Category to delete</div>
              <div className="font-medium">{categoryToDelete?.name}</div>
              <div className="text-xs text-muted-foreground">
                {count === null
                  ? "Checking..."
                  : `${count} activities will be reassigned`}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">
                Reassign activities to
              </label>
              {
                // compute options without mutating state synchronously
              }
              <select
                value={
                  targetId ??
                  categories.find((c) => c.id !== categoryToDelete?.id)?.id ??
                  undefined
                }
                onChange={(e) => setTargetId(parseInt(e.target.value, 10))}
                className="w-full rounded border p-2 bg-neutral-800"
              >
                {categories
                  .filter((c) => c.id !== categoryToDelete?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-destructive text-destructive-foreground"
              >
                Delete & Reassign
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
};

export default DeleteReassignModal;
