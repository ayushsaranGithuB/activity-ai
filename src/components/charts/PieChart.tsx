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

const colors = ["#222", "#444", "#666", "#888", "#aaa", "#ccc", "#eee"];

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
