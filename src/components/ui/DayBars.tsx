import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ActivityLogItem } from "@/types";
import { formatMinutes } from "@/lib/utils";

function minutesRoundUpTo30(m: number) {
  return Math.ceil(m / 30) * 30;
}

export default function DayBars({
  activities,
}: {
  activities: ActivityLogItem[];
}) {
  // Aggregate minutes per category for the day
  const map = new Map<string, number>();
  activities.forEach((a) => {
    const name = a.category || "Uncategorized";
    const mins = a.length_mins ?? 30;
    map.set(name, (map.get(name) ?? 0) + mins);
  });

  const categories = Array.from(map.keys());
  if (categories.length === 0) return null;

  // Create data array so each category gets its own x-position (not stacked)
  const data = categories.map((cat) => ({
    category: cat,
    minutes: map.get(cat) || 0,
  }));

  const max = Math.max(...data.map((d) => d.minutes), 0);
  const maxTick = minutesRoundUpTo30(max || 30);
  const ticks: number[] = [];
  for (let t = 0; t <= maxTick; t += 30) ticks.push(t);

  return (
    <div style={{ width: "100%", height: 200 }} className="px-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#b9bbbd44" />
          <XAxis
            dataKey="category"
            interval={0}
            angle={-40}
            textAnchor="end"
            height={48}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type="number"
            domain={[0, maxTick]}
            ticks={ticks}
            interval={0}
            tickFormatter={(v: number) => {
              const mins = Math.round(v as number);
              if (mins === 0) return `0m`;
              const h = Math.floor(mins / 60);
              const rem = mins % 60;
              if (h > 0 && rem > 0) return `${h + rem / 60}h`;
              if (h > 0) return `${h}h`;
              return `${rem}m`;
            }}
            allowDecimals={false}
            width={56}
          />
          <Tooltip formatter={(value: number) => formatMinutes(value)} />
          <Bar
            dataKey="minutes"
            fill="#9be3f8ff"
            radius={[4, 4, 0, 0]}
            barSize={16}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
