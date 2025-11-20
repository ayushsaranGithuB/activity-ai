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

export default function BarChart({ trends, onCategoryClick }: BarChartProps) {
  if (trends.length === 0) return null;

  const data = trends.map((trend) => ({
    name: trend.category,
    count: trend.activityCount,
    category: trend.category,
  }));

  return (
    <div className="trends-bar-chart">
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar
          data={data}
          margin={{ top: 20, right: 20, left: -20, bottom: 60 }}
        >
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar
            dataKey="count"
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
