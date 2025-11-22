import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { dbQuery } from "@/agent/tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Trash,
} from "lucide-react";
import { sample_activities } from "@/components/dummyData/sample-activities";
import { ActivityLogItem } from "@/types";
import clsx from "clsx";

// Use ActivityLogItem type from types

const Logs: React.FC = () => {
  const [activeActivityId, setActiveActivityId] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<ActivityLogItem | null>(
    null
  );
  const [editDescription, setEditDescription] = useState("");
  const [editTimestamp, setEditTimestamp] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);
  // Fetch activities on mount
  useEffect(() => {
    async function fetchActivities() {
      if (Capacitor.isNativePlatform()) {
        try {
          const rows = await dbQuery(
            "SELECT id, description, category_id, timestamp FROM activities ORDER BY timestamp DESC"
          );
          // Map rows to Activity type
          const mapped: ActivityLogItem[] = rows.map((a: ActivityLogItem) => ({
            id: a.id,
            description: a.description,
            category_id: a.category_id,
            timestamp: a.timestamp,
            category: undefined, // You can join category name if needed
          }));
          setActivities(mapped);
        } catch (err) {
          console.error("Failed to fetch activities from SQLite:", err);
        }
      } else {
        // Web: use dummy data for testing
        setActivities([...sample_activities]);
      }
    }
    fetchActivities();
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const groupActivitiesByDate = (activities: ActivityLogItem[]) => {
    const groups: { [key: string]: ActivityLogItem[] } = {};

    activities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else {
        dateKey = date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  };

  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const groupedActivities = groupActivitiesByDate(paginatedActivities);
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText />
            Log
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dateActivities]) => (
          <Card key={date}>
            <CardHeader className="p-1">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{date}</span>
                <Badge variant="secondary">
                  {dateActivities.length} activities
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-3">
                {dateActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={clsx(
                      `flex flex-col my-6 bg-card hover:bg-muted/50 transition-colors cursor-pointer rounded-lg p-4`,
                      activeActivityId === activity.id && "bg-white/10"
                    )}
                    onClick={() => setActiveActivityId(activity.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        {activity.category && (
                          <Badge variant="outline" className="mt-1 opacity-50">
                            {activity.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {activeActivityId === activity.id && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditActivity(activity);
                            setEditDescription(activity.description);
                            setEditTimestamp(activity.timestamp);
                            setEditModalOpen(true);
                          }}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteActivityId(activity.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {/* Edit Modal */}
                {editModalOpen && editActivity && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-black p-6 rounded shadow-lg min-w-[320px]">
                      <h3 className="text-lg font-bold mb-4">Edit Activity</h3>
                      <label className="block mb-2">Description:</label>
                      <input
                        type="text"
                        className="w-full border px-2 py-1 mb-4"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                      <label className="block mb-2">Time:</label>
                      <input
                        type="datetime-local"
                        className="w-full border px-2 py-1 mb-4"
                        value={(() => {
                          // Convert UTC ISO string to local datetime-local format
                          const d = new Date(editTimestamp);
                          const pad = (n: number) =>
                            n.toString().padStart(2, "0");
                          const yyyy = d.getFullYear();
                          const mm = pad(d.getMonth() + 1);
                          const dd = pad(d.getDate());
                          const hh = pad(d.getHours());
                          const min = pad(d.getMinutes());
                          return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
                        })()}
                        onChange={(e) => {
                          // Get local time from input and convert to ISO string
                          const local = new Date(e.target.value);
                          setEditTimestamp(local.toISOString());
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditModalOpen(false);
                            setEditActivity(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            // Save changes (implement dbUpdate)
                            if (editActivity) {
                              await dbQuery(
                                `UPDATE activities SET description = ?, timestamp = ? WHERE id = ?`,
                                [
                                  editDescription,
                                  editTimestamp,
                                  editActivity.id,
                                ]
                              );
                              setEditModalOpen(false);
                              setEditActivity(null);
                              // Refresh activities
                              const rows = await dbQuery(
                                "SELECT id, description, category_id, timestamp FROM activities ORDER BY timestamp DESC"
                              );
                              setActivities(rows);
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirmOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-black p-6 rounded shadow-lg min-w-[320px]">
                      <h3 className="text-lg font-bold mb-4">
                        Delete Activity?
                      </h3>
                      <p className="mb-4">
                        Are you sure you want to delete this activity?
                      </p>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setDeleteConfirmOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (deleteActivityId != null) {
                              await dbQuery(
                                `DELETE FROM activities WHERE id = ?`,
                                [deleteActivityId]
                              );
                              setDeleteConfirmOpen(false);
                              setDeleteActivityId(null);
                              // Refresh activities
                              const rows = await dbQuery(
                                "SELECT id, description, category_id, timestamp FROM activities ORDER BY timestamp DESC"
                              );
                              setActivities(rows);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No activities logged yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a conversation to log your activities!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Logs;
