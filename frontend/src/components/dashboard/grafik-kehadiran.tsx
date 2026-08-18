"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockData = [
  { month: "Jul", hadir: 98, izin: 2, alpa: 0 },
  { month: "Ags", hadir: 95, izin: 4, alpa: 1 },
  { month: "Sep", hadir: 97, izin: 2, alpa: 1 },
  { month: "Okt", hadir: 93, izin: 5, alpa: 2 },
  { month: "Nov", hadir: 96, izin: 3, alpa: 1 },
  { month: "Des", hadir: 99, izin: 1, alpa: 0 },
];

export function GrafikKehadiran() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[280px] w-full animate-pulse rounded-md bg-muted/10 flex items-center justify-center">
        <span className="text-xs text-muted">Memuat grafik kehadiran...</span>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mockData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="month"
            stroke="var(--color-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--color-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[80, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            itemStyle={{ color: "var(--color-ink)" }}
            formatter={(value: any) => [`${value}%`, "Kehadiran"]}
          />
          <Area
            type="monotone"
            dataKey="hadir"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorHadir)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
