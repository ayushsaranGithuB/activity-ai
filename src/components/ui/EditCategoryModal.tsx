import React, { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { icons } from "@/lib/lucideIcons";
import { Search } from "lucide-react";
import DeleteReassignModal from "@/components/ui/DeleteReassignModal";
import type { CategoryItem, PartialCategoryItem } from "@/types/categoryItem";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    icon?: string;
    description?: string;
  }) => Promise<void> | void;
  categories?: CategoryItem[];
  onDelete?: (id: number, targetId: number) => Promise<void> | void;
  initial?: PartialCategoryItem;
};

const EditCategoryModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  categories,
  onDelete,
  initial,
}) => {
  const [name, setName] = useState(() => initial?.name || "");
  const [description, setDescription] = useState(
    () => initial?.description || ""
  );
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(
    () => initial?.icon
  );
  const [query, setQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return icons;
    return icons.filter((i) => i.key.toLowerCase().includes(q));
  }, [query]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    await onSave({
      id: initial?.id,
      name: name.trim(),
      icon: selectedIcon,
      description: description?.trim(),
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {initial?.id ? "Edit Category" : "New Category"}
          </SheetTitle>
          <SheetDescription>
            Set a name and pick an icon for this category.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 w-full">
          <div className="space-y-3">
            <div>
              <label className="text-sm">Name</label>
              <input
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                className="w-full rounded border p-2 bg-neutral-800"
              />
            </div>
            <div>
              <label className="text-sm">Description (optional)</label>
              <input
                value={description}
                onChange={(e) =>
                  setDescription((e.target as HTMLInputElement).value)
                }
                className="w-full rounded border p-2 bg-neutral-800"
              />
            </div>

            <div>
              <label className="text-sm">Icon</label>
              <div className="flex items-center space-x-2 mb-2">
                <div className="relative flex-1">
                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery((e.target as HTMLInputElement).value)
                    }
                    placeholder="Search icons..."
                    className="w-full rounded border p-2 bg-neutral-800"
                  />
                  <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center border rounded bg-neutral-950">
                  {selectedIcon ? (
                    // find component
                    (() => {
                      const found = icons.find((ii) => ii.key === selectedIcon);
                      if (found) {
                        const C = found.Component;
                        return <C className="h-6 w-6" />;
                      }
                      return (
                        <span className="text-xs text-muted-foreground">—</span>
                      );
                    })()
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto thin-scrollbar pr-2">
                  {filtered.map((ic) => {
                    const C = ic.Component;
                    return (
                      <button
                        key={ic.key}
                        className={`p-2 rounded border bg-neutral-900 flex items-center justify-center ${
                          selectedIcon === ic.key ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedIcon(ic.key)}
                        type="button"
                      >
                        <C className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
                {/* Bottom fade to indicate more content when scrollable */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-neutral-950" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                {initial?.id ? (
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      if (!initial?.id) return;
                      const others = (categories || []).filter(
                        (x) => x.id !== initial.id
                      );
                      if (!others || others.length === 0) {
                        toast.error("Cannot delete the only category");
                        return;
                      }
                      setDeleteModalOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {initial?.id ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter />
        <DeleteReassignModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          categoryToDelete={
            initial?.id
              ? { id: initial.id as number, name: initial.name || "" }
              : undefined
          }
          categories={categories || []}
          onConfirm={async (targetId: number) => {
            if (!initial?.id) return;
            try {
              if (onDelete) {
                await onDelete(initial.id as number, targetId);
              }
              setDeleteModalOpen(false);
              onClose();
            } catch (err) {
              console.error(err);
              toast.error("Delete failed");
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
};

export default EditCategoryModal;
