'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import React from 'react';

interface Sentiment {
  createdAt: string;
  progress: number;
}

const chartData = [
  { range: '0-10%', votes: 0 },
  { range: '10-20%', votes: 0 },
  { range: '20-30%', votes: 0 },
  { range: '30-40%', votes: 0 },
  { range: '40-50%', votes: 0 },
  { range: '50-60%', votes: 0 },
  { range: '60-70%', votes: 0 },
  { range: '70-80%', votes: 0 },
  { range: '80-90%', votes: 0 },
  { range: '90-100%', votes: 0 },
];

const chartConfig = {
  votes: {
    label: 'Votes',
    color: '#2563eb',
  },
} satisfies ChartConfig;

export function LineChart() {
  const [data, setData] = React.useState(chartData);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sentiment');
        const sentiments: Sentiment[] = await response.json();

        const newData = [...chartData];
        sentiments.forEach((s) => {
          const rangeIndex = Math.floor(s.progress / 10);
          if (rangeIndex >= 0 && rangeIndex < 10) {
            newData[rangeIndex].votes++;
          }
        });

        setData(newData);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground dark:text-white text-center">
        {formatDate(new Date())}
      </p>
      <ChartContainer
        config={chartConfig}
        className="h-[200px] sm:h-[300px] w-full"
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{
            left: 0,
            right: 10,
            top: 10,
            bottom: 40,
          }}
        >
          <XAxis
            dataKey="range"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 10 }}
            interval={0}
          />
          <YAxis width={30} tick={{ fontSize: 10 }} />
          <Bar dataKey="votes" fill="var(--color-votes)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
