import React, { useEffect, useState } from "react";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { storage } from "@/agent/tools";
import { toast } from "react-hot-toast";
import { Plus, ChevronLeft } from "lucide-react";
import EditCategoryModal from "@/components/ui/EditCategoryModal";
import { icons } from "@/lib/lucideIcons";
import type { CategoryItem } from "@/types/categoryItem";

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = async () => {
    await load();
  };

  const load = async () => {
    try {
      const cats = await storage.getAllCategories();
      setCategories(cats || []);
    } catch (e) {
      console.error("Failed to load categories", e);
      setCategories([]);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      try {
        console.debug(
          "Categories screen loaded, items=",
          (await storage.getAllCategories())?.length
        );
      } catch (e) {
        console.warn("Categories: failed to log categories count", e);
      }
    })();
  }, []);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Link
            to="/settings"
            className="text-sm text-primary   py-1 rounded-md flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <h1 className="text-2xl font-bold">Categories</h1>
        </div>
        <div>
          <Button
            variant="outline"
            className="flex items-center space-x-2"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 pt-2">
        <div>
          <div>
            <CardTitle className="flex items-center space-x-2 mb-5">
              <span>Manage your categories</span>
            </CardTitle>
          </div>
          <div className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories found.
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((c: CategoryItem) => (
                  <div
                    key={c.id}
                    className="py-3 px-1 rounded-lg bg-neutral-900 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded bg-neutral-950">
                        {c.icon ? (
                          (() => {
                            const found = icons.find((i) => i.key === c.icon);
                            if (found) {
                              const C = found.Component;
                              return <C className="h-5 w-5" />;
                            }
                            return (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        {c.description ? (
                          <div className="text-xs text-muted-foreground">
                            {c.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(c);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <EditCategoryModal
        key={`${editing?.id ?? "new"}-${modalOpen ? 1 : 0}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing ?? undefined}
        categories={categories}
        onDelete={async (id: number, targetId: number) => {
          const res = await storage.deleteCategoryAndReassign(id, targetId);
          if (!res.success) {
            toast.error("Delete failed");
          } else {
            toast.success("Category deleted and activities reassigned");
            setModalOpen(false);
            await refresh();
          }
        }}
        onSave={async (data) => {
          if (data.id) {
            const res = await storage.updateCategory(data.id, {
              name: data.name,
              description: data.description,
              icon: data.icon,
            });
            if (res?.success) {
              toast.success("Category updated");
            } else {
              toast.error("Failed to update category");
            }
          } else {
            const res = await storage.createCategory({
              name: data.name,
              description: data.description,
              icon: data.icon,
            });
            if (res?.success) {
              toast.success("Category created");
            } else {
              toast.error("Failed to create category");
            }
          }
          await refresh();
        }}
      />
    </div>
  );
};

export default Categories;
