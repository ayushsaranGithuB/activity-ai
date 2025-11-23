import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleDot, Pencil, Trash } from "lucide-react";
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
      `flex flex-col mb-2 bg-card hover:bg-muted/50 transition-colors cursor-pointer border-l border-neutral-600 px-4 ml-3 py-1 relative`,
      active && "bg-white/10"
    )}
    onClick={onClick}
  >
    <CircleDot
      className="h-6 w-6 absolute left-[-12px] top-0 py-1 bg-neutral-900"
      color="#666"
    />
    <div className="flex  items-center justify-between gap-3 pb-3">
      <div className="flex-1 flex-col flex justify-between items-start w-full">
        {/* Date */}
        <div className="text-xs text-muted-foreground opacity-50 mb-1">
          {new Date(activity.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <p className="font-medium">{activity.description}</p>
      </div>
      {activity.category && (
        <Badge variant="outline" className="mt-1 opacity-50">
          {activity.category}
        </Badge>
      )}
    </div>
    {active && (
      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
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
            onDelete();
          }}
        >
          <Trash />
          Delete
        </Button>
      </div>
    )}
  </div>
);

export default LogItem;
