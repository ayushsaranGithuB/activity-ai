import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { dbQuery } from "@/agent/tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { sample_activities } from "@/components/dummyData/sample-activities";
import { ActivityLogItem } from "@/types";

// Use ActivityLogItem type from types

const Logs: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
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
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">View your logged activities</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dateActivities]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{date}</span>
                <Badge variant="secondary">
                  {dateActivities.length} activities
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dateActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      {activity.category && (
                        <Badge variant="outline" className="mt-1">
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
                ))}
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
