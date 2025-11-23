import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { ActivityLogItem } from "@/types";
import LogItem from "@/components/logs/LogItem";
import EditModal from "@/components/logs/EditModal";
import DeleteConfirmModal from "@/components/logs/DeleteConfirmModal";
import { groupActivitiesByDate } from "@/utils/logs";
import {
  fetchActivities,
  updateActivity,
  deleteActivity,
} from "@/lib/logsActions";

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
    async function loadActivities() {
      const acts = await fetchActivities();
      setActivities(acts);
    }
    loadActivities();
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // ...existing code...

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
              <CardTitle className="flex items-center space-x-2 justify-between mb-3 mt-3">
                <div className="items-center space-x-2 flex">
                  <Calendar className="h-5 w-5" />
                  <span>{date}</span>
                </div>

                <Badge variant="secondary" className="opacity-60">
                  {dateActivities.length} activities
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 bg-neutral-800 rounded-xl ">
              <div className="space-y-3 pt-2 pl-1">
                {dateActivities.map((activity) => (
                  <LogItem
                    key={activity.id}
                    activity={activity}
                    active={activeActivityId === activity.id}
                    onClick={() => setActiveActivityId(activity.id)}
                    onEdit={() => {
                      setEditActivity(activity);
                      setEditDescription(activity.description);
                      // Convert timestamp to local datetime-local format
                      const d = new Date(activity.timestamp);
                      const pad = (n: number) => n.toString().padStart(2, "0");
                      const yyyy = d.getFullYear();
                      const mm = pad(d.getMonth() + 1);
                      const dd = pad(d.getDate());
                      const hh = pad(d.getHours());
                      const min = pad(d.getMinutes());
                      setEditTimestamp(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
                      setEditModalOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteActivityId(activity.id);
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))}
                <EditModal
                  open={editModalOpen && !!editActivity}
                  description={editDescription}
                  timestamp={editTimestamp}
                  onDescriptionChange={setEditDescription}
                  onTimestampChange={(val) => {
                    // Convert local datetime-local to ISO string
                    const local = new Date(val);
                    setEditTimestamp(val);
                    setEditActivity((prev) =>
                      prev ? { ...prev, timestamp: local.toISOString() } : prev
                    );
                  }}
                  onCancel={() => {
                    setEditModalOpen(false);
                    setEditActivity(null);
                  }}
                  onSave={async () => {
                    if (editActivity) {
                      await updateActivity(
                        editActivity.id,
                        editDescription,
                        editActivity.timestamp
                      );
                      setEditModalOpen(false);
                      setEditActivity(null);
                      const acts = await fetchActivities();
                      setActivities(acts);
                    }
                  }}
                />
                <DeleteConfirmModal
                  open={deleteConfirmOpen}
                  onCancel={() => setDeleteConfirmOpen(false)}
                  onDelete={async () => {
                    if (deleteActivityId != null) {
                      await deleteActivity(deleteActivityId);
                      setDeleteConfirmOpen(false);
                      setDeleteActivityId(null);
                      const acts = await fetchActivities();
                      setActivities(acts);
                    }
                  }}
                />
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
