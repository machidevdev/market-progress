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
  const [sentiment, setSentiment] = React.useState({
    current: 0,
    yesterday: 0,
    trend: 'neutral',
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sentiment');
        const sentiments: Sentiment[] = await response.json();

        const newData = [...chartData];
        let totalProgress = 0;
        let todayVotes = 0;
        let yesterdayProgress = 0;
        let yesterdayVotes = 0;

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        sentiments.forEach((s) => {
          const sentimentDate = new Date(s.createdAt).toDateString();
          const rangeIndex = Math.floor(s.progress / 10);

          if (rangeIndex >= 0 && rangeIndex < 10) {
            newData[rangeIndex].votes++;

            if (sentimentDate === today) {
              totalProgress += s.progress;
              todayVotes++;
            } else if (sentimentDate === yesterday) {
              yesterdayProgress += s.progress;
              yesterdayVotes++;
            }
          }
        });

        const currentSentiment = todayVotes ? totalProgress / todayVotes : 0;
        const yesterdaySentiment = yesterdayVotes
          ? yesterdayProgress / yesterdayVotes
          : 0;

        setSentiment({
          current: Math.round(currentSentiment),
          yesterday: Math.round(yesterdaySentiment),
          trend:
            currentSentiment > yesterdaySentiment
              ? 'positive'
              : currentSentiment < yesterdaySentiment
              ? 'negative'
              : 'neutral',
        });

        setData(newData);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchData();
  }, []);

  const getSentimentDescription = () => {
    const diff = sentiment.current - sentiment.yesterday;
    if (sentiment.trend === 'positive') {
      return `Market sentiment is up ${Math.abs(diff)}% from yesterday (${
        sentiment.yesterday
      }%). Current average: ${sentiment.current}%`;
    } else if (sentiment.trend === 'negative') {
      return `Market sentiment is down ${Math.abs(diff)}% from yesterday (${
        sentiment.yesterday
      }%). Current average: ${sentiment.current}%`;
    }
    return `Market sentiment unchanged from yesterday (${sentiment.yesterday}%). Current average: ${sentiment.current}%`;
  };

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
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground dark:text-white">
          {formatDate(new Date())}
        </p>
        <p className="text-sm text-muted-foreground dark:text-white">
          {getSentimentDescription()}
        </p>
      </div>
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
