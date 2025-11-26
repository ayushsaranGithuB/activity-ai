import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleDot, Pencil, Trash } from "lucide-react";
import clsx from "clsx";
import { ActivityLogItem } from "@/types";
import { formatMinutes } from "@/lib/utils";

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
      active && "bg-white/10 rounded-lg"
    )}
    onClick={onClick}
  >
    <CircleDot
      className={clsx(
        "h-6 w-6 absolute left-[-12px] top-0 py-1  rounded-full",
        active ? "bg-neutral-700" : "bg-neutral-900"
      )}
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
          {activity.length_mins != null && (
            <span className="ml-2 text-xs opacity-60">
              • {formatMinutes(activity.length_mins)}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium">{activity.description}</p>
          {activity.sub_category && (
            <div className="text-sm text-muted-foreground  ">
              {activity.sub_category && (
                <div className="">{activity.sub_category}</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div>
        {activity.category && (
          <Badge variant="outline" className="mt-1 opacity-50">
            {activity.category}
          </Badge>
        )}
      </div>
    </div>
    {active && (
      <div className="flex w-full justify-between mb-1">
        <Button
          size="sm"
          className="p-0"
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
          className="p-0 opacity-40"
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
