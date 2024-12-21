'use client';

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import React from 'react';

interface Sentiment {
  createdAt: string;
  progress: number;
}

// For the left chart - keeps the original curve shape
const marketCycleData = [
  {
    time: 0,
    price: 20,
    phase: 'Disbelief-Start',
    displayPhase: 'Disbelief',
    text: 'This rally will fail.',
  },
  {
    time: 10,
    price: 25,
    phase: 'Hope',
    displayPhase: 'Hope',
    text: 'A recovery is possible.',
  },
  {
    time: 20,
    price: 35,
    phase: 'Optimism',
    displayPhase: 'Optimism',
    text: 'This rally is real!',
  },
  {
    time: 30,
    price: 45,
    phase: 'Belief',
    displayPhase: 'Belief',
    text: 'Time to get invested.',
  },
  {
    time: 40,
    price: 90,
    phase: 'Euphoria',
    displayPhase: 'Euphoria',
    text: "We're all going to be rich!",
  },
  {
    time: 42,
    price: 70,
    phase: 'Euphoria-Wick',
    displayPhase: '',
    text: 'Buy the dip!',
  },
  {
    time: 44,
    price: 85,
    phase: 'Euphoria-Recovery',
    displayPhase: '',
    text: 'Back to ATH!',
  },
  {
    time: 45,
    price: 65,
    phase: 'Complacency',
    displayPhase: 'Complacency',
    text: 'Just cooling off.',
  },
  {
    time: 60,
    price: 45,
    phase: 'Anxiety',
    displayPhase: 'Anxiety',
    text: 'This dip is taking longer...',
  },
  {
    time: 70,
    price: 30,
    phase: 'Denial',
    displayPhase: 'Denial',
    text: 'They will come back.',
  },
  {
    time: 80,
    price: 20,
    phase: 'Panic',
    displayPhase: 'Panic',
    text: "Everyone's selling!",
  },
  {
    time: 90,
    price: 15,
    phase: 'Capitulation',
    displayPhase: 'Capitulation',
    text: "I'm getting out!",
  },
  {
    time: 95,
    price: 10,
    phase: 'Anger',
    displayPhase: 'Anger',
    text: 'Who shorted the market!?',
  },
  {
    time: 100,
    price: 8,
    phase: 'Depression',
    displayPhase: 'Depression',
    text: 'My retirement money is lost.',
  },
  {
    time: 105,
    price: 25,
    phase: 'Disbelief-End',
    displayPhase: 'Disbelief',
    text: "This is a sucker's rally.",
  },
];

// For the right chart - ordered from bottom to top
export function getMarketPhase(progress: number) {
  if (progress < 10) return 'Depression';
  if (progress < 20) return 'Anger';
  if (progress < 30) return 'Capitulation';
  if (progress < 40) return 'Panic';
  if (progress < 50) return 'Denial';
  if (progress < 60) return 'Anxiety';
  if (progress < 70) return 'Complacency';
  if (progress < 80) return 'Euphoria';
  if (progress < 85) return 'Belief';
  if (progress < 90) return 'Optimism';
  if (progress < 95) return 'Hope';
  return 'Disbelief';
}

// Add this after marketCycleData
const phaseColors = {
  'Disbelief-Start': '#3b82f6',
  'Disbelief-End': '#3b82f6',
  Hope: '#3b82f6',
  Optimism: '#3b82f6',
  Belief: '#22c55e',
  Euphoria: '#22c55e',
  Complacency: '#22c55e',
  Anxiety: '#ef4444',
  Denial: '#ef4444',
  Panic: '#ef4444',
  Capitulation: '#ef4444',
  Anger: '#ef4444',
  Depression: '#ef4444',
} as const;

const chartConfig = {
  price: {
    label: 'Market Psychology',
    color: '#2563eb',
  },
} satisfies ChartConfig;

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Add this prop to accept click handler
interface LineChartProps {
  onVote?: (phase: string) => void;
  isVoting?: boolean;
}

// Add this type
type Phase = keyof typeof phaseColors;

// Add a new type for the correlation data
interface CorrelationData {
  date: string;
  sentiment: number;
  phase: string;
  totalVotes: number;
}

export function LineChart({ onVote, isVoting = false }: LineChartProps) {
  const [data, setData] = React.useState(
    marketCycleData.map((item) => ({ ...item, votes: 0 }))
  );
  const [, setYesterdayData] = React.useState(
    marketCycleData.map((item) => ({ ...item, votes: 0 }))
  );
  const [summary, setSummary] = React.useState({
    totalVotes: 0,
    todayPhase: '',
    yesterdayPhase: '',
    trend: '' as 'up' | 'down' | 'same',
  });
  const [correlationData, setCorrelationData] = React.useState<
    CorrelationData[]
  >([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sentiment');
        const { today: todayVotes, yesterday: yesterdayVotes } =
          await response.json();

        // Reset votes for new day
        const newData = marketCycleData.map((item) => ({ ...item, votes: 0 }));

        // Count votes and calculate today's average
        todayVotes.forEach((s: Sentiment) => {
          const phase = getMarketPhase(s.progress);
          const dataPoint = newData.find((d) => d.phase === phase);
          if (dataPoint) {
            dataPoint.votes = (dataPoint.votes || 0) + 1;
          }
        });

        // Process yesterday's data
        const yesterdayNewData = marketCycleData.map((item) => ({
          ...item,
          votes: 0,
        }));
        yesterdayVotes.forEach((s: Sentiment) => {
          const phase = getMarketPhase(s.progress);
          const dataPoint = yesterdayNewData.find((d) => d.phase === phase);
          if (dataPoint) {
            dataPoint.votes = (dataPoint.votes || 0) + 1;
          }
        });

        // Calculate averages
        const todayTotal = todayVotes.reduce(
          (acc: number, curr: Sentiment) => acc + curr.progress,
          0
        );
        const yesterdayTotal = yesterdayVotes.reduce(
          (acc: number, curr: Sentiment) => acc + curr.progress,
          0
        );

        const todayAvg = todayVotes.length
          ? Math.round(todayTotal / todayVotes.length)
          : 0;
        const yesterdayAvg = yesterdayVotes.length
          ? Math.round(yesterdayTotal / yesterdayVotes.length)
          : 0;

        const todayPhase = getMarketPhase(todayAvg);
        const yesterdayPhase = yesterdayVotes.length
          ? getMarketPhase(yesterdayAvg)
          : '';

        setSummary({
          totalVotes: todayVotes.length,
          todayPhase,
          yesterdayPhase,
          trend: !yesterdayPhase
            ? 'same'
            : todayAvg > yesterdayAvg
            ? 'up'
            : todayAvg < yesterdayAvg
            ? 'down'
            : 'same',
        });

        setData(newData);
        setYesterdayData(yesterdayNewData);

        // Calculate correlation data
        const correlationData = [
          {
            date: 'Yesterday',
            sentiment: yesterdayAvg,
            phase: getMarketPhase(yesterdayAvg),
            totalVotes: yesterdayVotes.length,
          },
          {
            date: 'Today',
            sentiment: todayAvg,
            phase: getMarketPhase(todayAvg),
            totalVotes: todayVotes.length,
          },
        ];

        setCorrelationData(correlationData);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchData();
  }, [isVoting]);

  const getSentimentDescription = () => {
    if (!summary.todayPhase) return 'Waiting for first votes of the day...';
    if (!summary.yesterdayPhase)
      return (
        <>
          Current overall sentiment:{' '}
          <span style={{ color: phaseColors[summary.todayPhase as Phase] }}>
            {summary.todayPhase}
          </span>
        </>
      );

    // Better handling of same phase case
    if (summary.todayPhase === summary.yesterdayPhase) {
      return (
        <>
          Market sentiment remains steady in{' '}
          <span style={{ color: phaseColors[summary.todayPhase as Phase] }}>
            {summary.todayPhase}
          </span>{' '}
          phase
        </>
      );
    }

    // Movement case
    return (
      <>
        Market sentiment moved {summary.trend} to{' '}
        <span style={{ color: phaseColors[summary.todayPhase as Phase] }}>
          {summary.todayPhase}
        </span>{' '}
        from{' '}
        <span style={{ color: phaseColors[summary.yesterdayPhase as Phase] }}>
          {summary.yesterdayPhase}
        </span>
      </>
    );
  };

  return (
    <div className="space-y-4 w-full">
      {isVoting && (
        <p className="hidden sm:block  text-center text-orange-500 font-bold text-2xl">
          Click on the chart to select your market sentiment and vote to see the
          results.
        </p>
      )}
      <div className="text-center space-y-2 px-4 sm:px-0">
        <p className="hidden sm:block text-sm text-muted-foreground dark:text-white">
          {formatDate(new Date())}
        </p>
        <p className="text-xs text-muted-foreground dark:text-gray-400">
          Total votes today: {summary.totalVotes}
        </p>
        {!isVoting && (
          <p className="text-sm font-medium text-muted-foreground dark:text-white">
            {getSentimentDescription()}
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-12 sm:mt-20 pt-20">
        <div className="w-full sm:w-1/2">
          <p className="text-center text-sm text-gray-400 mb-4">
            Vote Distribution by Phase
          </p>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 35,
                bottom: 20,
              }}
              onClick={(data) => {
                if (isVoting && onVote && data.activePayload) {
                  onVote(data.activePayload[0].payload.phase);
                }
              }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="phase"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 8 }}
                interval={0}
                scale="point"
              />
              <YAxis yAxisId="price" hide={true} />
              <YAxis
                yAxisId="votes"
                orientation="right"
                tick={{ fontSize: 8 }}
                width={20}
                hide={isVoting}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/80 p-3 rounded-md text-xs">
                        <p className="font-bold text-white text-sm mb-1">
                          {data.displayPhase}
                        </p>
                        <p className="text-gray-200 whitespace-pre-line mb-2">
                          {data.text}
                        </p>
                        {!isVoting && (
                          <p className="text-gray-200">
                            Votes: {data.votes || 0}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="url(#colorGradient)"
                fill="transparent"
                strokeWidth={3}
                dot={false}
                cursor={isVoting ? 'pointer' : 'default'}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="url(#colorGradient)"
                strokeWidth={3}
                cursor={isVoting ? 'pointer' : 'default'}
                dot={(props) => {
                  const { cx, cy } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="white"
                      stroke="url(#colorGradient)"
                      strokeWidth={2}
                    />
                  );
                }}
              />
              {!isVoting && (
                <Bar
                  yAxisId="votes"
                  dataKey="votes"
                  fill="rgba(255,255,255,0.1)"
                  radius={4}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </div>

        {!isVoting && (
          <div className="w-full sm:w-1/2">
            <p className="text-center text-sm text-gray-400 mb-4">
              Market Psychology Trend
            </p>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ComposedChart
                data={correlationData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 100,
                  bottom: 20,
                }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'white' }}
                  interval={0}
                  padding={{ left: 50, right: 50 }}
                  width={100}
                />
                <YAxis
                  dataKey="sentiment"
                  domain={[0, 100]}
                  ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 100]}
                  tickFormatter={(value) => getMarketPhase(value)}
                  width={100}
                  orientation="right"
                  tick={{
                    fontSize: 8,
                    fill: 'white',
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-black/80 p-2 rounded-md text-xs">
                          <p className="font-bold text-white">{data.date}</p>
                          <p className="text-gray-200">Phase: {data.phase}</p>
                          <p className="text-gray-200">
                            Votes: {data.totalVotes}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sentiment"
                  stroke="url(#colorGradient)"
                  strokeWidth={2}
                  connectNulls={true}
                  dot={{
                    fill: 'white',
                    strokeWidth: 2,
                    r: 4,
                    stroke: 'url(#colorGradient)',
                  }}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
}
