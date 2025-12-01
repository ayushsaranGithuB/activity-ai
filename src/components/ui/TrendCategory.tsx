import { useState } from "react";
import { TrendDataCategory, TrendDataSubCategory } from "@/types";
import { Activity, ChevronDown, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { icons } from "@/lib/lucideIcons";
import { formatMinutes } from "@/lib/utils";

const TrendCategory = ({
  trend,
  period,
}: {
  trend: TrendDataCategory;
  period?: string;
}) => {
  const [subCatIsOpen, setSubCatIsOpen] = useState(false);

  return (
    <div key={trend.category} className="space-y-2">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center w-full"
          onClick={() => {
            setSubCatIsOpen(!subCatIsOpen);
          }}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded bg-neutral-950">
            {(() => {
              const found = icons.find((i) => i.key === trend.icon);
              if (found) {
                const C = found.Component;
                return <C className="h-4 w-4" />;
              }
              return <Activity className="h-4 w-4" />;
            })()}
          </div>
          <span className="font-medium">{trend.category}</span>
          {subCatIsOpen ? (
            <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div
          className={`h-[2px] rounded-md bg-white/30`}
          style={{ width: `${trend.percentage}%` }}
        />
        <div className="flex items-center space-x-2  justify-between ">
          <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md text-right whitespace-nowrap">
            {formatMinutes(trend.totalMinutes)}
          </span>
          <span className="text-sm text-muted-foreground">
            {trend.percentage}%
          </span>
        </div>
      </div>
      <div
        id={`trend-${trend.category}`}
        className={subCatIsOpen ? "block" : "hidden"}
      >
        {period === "week" && trend.daily && (
          <div style={{ width: "100%", height: 130, overflow: "hidden" }}>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart
                data={trend.daily.map((d) => ({
                  day: d.day,
                  minutes: d.minutes,
                }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="minutes"
                  tickFormatter={(v) =>
                    v > 60
                      ? `${(Math.round(v as number) / 60).toFixed(1)}h`
                      : `${v}m`
                  }
                  tick={{ fontSize: 10 }}
                  interval={0}
                  allowDecimals={false}
                />
                <Tooltip formatter={(value: number) => formatMinutes(value)} />
                <Bar
                  dataKey="minutes"
                  fill="#9be3f8"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {trend.subcategories.map((sub: TrendDataSubCategory) => (
          <div
            key={sub.name}
            className="flex items-center justify-between ml-4  mb-0"
          >
            <div className="flex items-center space-x-3 w-full">
              <span className="text-xs text-muted-foreground text-right">
                {sub.name}
              </span>
            </div>
            <div className="flex items-center space-x-2 w-full justify-end">
              <span className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                {formatMinutes(sub.totalMinutes)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendCategory;
