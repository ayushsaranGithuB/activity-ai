import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import clsx from "clsx";
import { ActivityLogItem } from "@/types";

interface LogItemProps {
  activity: ActivityLogItem;
  active: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const LogItem: React.FC<LogItemProps> = ({
  activity,
  active,
  onClick,
  onEdit,
  onDelete,
}) => (
  <div
    className={clsx(
      `flex flex-col my-6 bg-card hover:bg-muted/50 transition-colors cursor-pointer rounded-lg p-4`,
      active && "bg-white/10"
    )}
    onClick={onClick}
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
    {active && (
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash />
          Delete
        </Button>
      </div>
    )}
  </div>
);

export default LogItem;
