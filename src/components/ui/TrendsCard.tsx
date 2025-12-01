import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";
import { Activity,  } from "lucide-react";
import { TrendDataCategory } from "@/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import TrendCategory from "./TrendCategory";

const TrendCard = ({
  title,
  trends,
  icon: Icon,
  color,
  period,
}: {
  title: string;
  trends: TrendDataCategory[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  period?: string;
}) => (
  <Card>
    <CardHeader className="pl-1">
      <CardTitle className="flex items-center space-x-2 pl-0">
        <Icon className={`h-5 w-5 ${color}`} />
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0 pr-2">
      {trends.length > 0 ? (
        <div className="space-y-4">
          <div style={{ width: "100%", height: 230, overflow: "hidden" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={trends.map((t) => ({
                  category: t.category,
                  minutes: t.totalMinutes,
                }))}
                margin={{ top: 8, right: 12, left: 0, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#b9bbbd44" />
                <XAxis
                  dataKey="category"
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) =>
                    period == "day"
                      ? `${Math.round(v as number)}min`
                      : `${Math.round((v as number) / 60)}h`
                  }
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <Tooltip formatter={(value: number) => formatMinutes(value)} />
                <Bar
                  dataKey="minutes"
                  fill="#9be3f8ff"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {trends.map((trend, key) => (
            <TrendCategory key={key} trend={trend} period={period} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No activities in this period</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default TrendCard;
