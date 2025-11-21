import React from "react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { CategoryTrend } from "../../types";

interface BarChartProps {
  trends: CategoryTrend[];
  onCategoryClick?: (category: string) => void;
}

const colors = ["#222", "#444", "#666", "#888", "#aaa", "#ccc", "#eee"];

export default function BarChart({ trends, onCategoryClick }: BarChartProps) {
  if (trends.length === 0) return null;

  const data = trends.map((trend) => ({
    name: `${trend.category} (${trend.activityCount})`,
    totalMinutes: trend.totalMinutes,
    category: trend.category,
    activityCount: trend.activityCount,
  }));

  return (
    <div className="trends-bar-chart">
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar
          data={data}
          margin={{ top: 20, right: 20, left: -20, bottom: 10 }}
        >
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 16 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
          />
          <Tooltip formatter={(value) => [`${value} min`, "Time"]} />
          <Bar
            dataKey="totalMinutes"
            onClick={(data) => onCategoryClick?.(data.category)}
            cursor={onCategoryClick ? "pointer" : "default"}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
