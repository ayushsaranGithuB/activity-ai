import React from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryTrend } from "../../types";

interface PieChartProps {
  trends: CategoryTrend[];
  onCategoryClick?: (category: string) => void;
}

const colors = [
  "#6B8E7F",
  "#8FA3B0",
  "#B89B9D",
  "#9B8E9F",
  "#A8927D",
  "#7F9AA3",
  "#9F8E8A",
  "#86A397",
  "#A89BA3",
  "#8B9A8E",
];

export default function PieChart({ trends, onCategoryClick }: PieChartProps) {
  if (trends.length === 0) return null;

  const data = trends.map((trend) => ({
    name: trend.category,
    value: trend.activityCount,
    category: trend.category,
  }));

  return (
    <div className="trends-pie-chart">
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name} (${entry.value})`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => onCategoryClick?.(data.category)}
            cursor={onCategoryClick ? "pointer" : "default"}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
