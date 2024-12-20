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

const marketCycleData = [
  {
    time: 0,
    price: 20,
    phase: 'Disbelief',
    text: 'This rally will fail like the others.',
  },
  { time: 10, price: 25, phase: 'Hope', text: 'A recovery is possible.' },
  { time: 20, price: 35, phase: 'Optimism', text: 'This rally is real!' },
  { time: 30, price: 45, phase: 'Belief', text: 'Time to get fully invested.' },
  {
    time: 40,
    price: 80,
    phase: 'Euphoria',
    text: "I'm a genius!\nWe're all going to be rich!",
  },
  {
    time: 50,
    price: 70,
    phase: 'Complacency',
    text: 'We just need to cool off\nfor the next rally.',
  },
  {
    time: 60,
    price: 55,
    phase: 'Anxiety',
    text: 'Why am I getting margin calls?\nThis dip is taking longer than expected.',
  },
  {
    time: 70,
    price: 40,
    phase: 'Denial',
    text: 'My investments are with great companies.\nThey will come back.',
  },
  {
    time: 80,
    price: 25,
    phase: 'Panic',
    text: "Shit! Everyone's selling. I need to get out!",
  },
  {
    time: 90,
    price: 15,
    phase: 'Capitulation',
    text: "I'm getting 100% out of the markets.\nI can't afford to lose more.",
  },
  {
    time: 95,
    price: 10,
    phase: 'Anger',
    text: 'Who shorted the market!?\nWhy did the government\nallow this to happen!?',
  },
  {
    time: 100,
    price: 15,
    phase: 'Depression',
    text: 'My retirement money is lost.\nHow can we pay for all this new stuff?\nI am an idiot.',
  },
];

// Add this after marketCycleData
const phaseColors = {
  Disbelief: '#3b82f6', // Blue
  Hope: '#3b82f6',
  Optimism: '#3b82f6',
  Belief: '#22c55e', // Green
  Euphoria: '#22c55e',
  Complacency: '#22c55e',
  Anxiety: '#ef4444', // Red
  Denial: '#ef4444',
  Panic: '#ef4444',
  Capitulation: '#ef4444',
  Anger: '#ef4444',
  Depression: '#ef4444',
};

// Map progress value (0-100) to market phase
export function getMarketPhase(progress: number) {
  if (progress < 10) return 'Disbelief';
  if (progress < 20) return 'Hope';
  if (progress < 30) return 'Optimism';
  if (progress < 40) return 'Belief';
  if (progress < 50) return 'Euphoria';
  if (progress < 60) return 'Complacency';
  if (progress < 70) return 'Anxiety';
  if (progress < 80) return 'Denial';
  if (progress < 90) return 'Panic';
  if (progress < 95) return 'Capitulation';
  if (progress < 98) return 'Anger';
  return 'Depression';
}

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

// Add this helper function to get phase position (0-11)
const getPhasePosition = (phase: string) => {
  return marketCycleData.findIndex((item) => item.phase === phase);
};

export function LineChart({ onVote, isVoting = false }: LineChartProps) {
  const [data, setData] = React.useState(
    marketCycleData.map((item) => ({ ...item, votes: 0 }))
  );
  const [summary, setSummary] = React.useState({
    totalVotes: 0,
    todayPhase: '',
    yesterdayPhase: '',
    trend: '' as 'up' | 'down' | 'same',
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sentiment');
        const { today: todayVotes, yesterday: yesterdayVotes } =
          await response.json();

        // Reset votes for new day
        const newData = marketCycleData.map((item) => ({ ...item, votes: 0 }));

        // Count votes and get most voted phase for today
        const todayPhaseCounts: { [key: string]: number } = {};
        todayVotes.forEach((s: Sentiment) => {
          const phase = getMarketPhase(s.progress);
          todayPhaseCounts[phase] = (todayPhaseCounts[phase] || 0) + 1;

          const dataPoint = newData.find((d) => d.phase === phase);
          if (dataPoint) {
            dataPoint.votes = (dataPoint.votes || 0) + 1;
          }
        });

        // Get most voted phase for yesterday
        const yesterdayPhaseCounts: { [key: string]: number } = {};
        yesterdayVotes.forEach((s: Sentiment) => {
          const phase = getMarketPhase(s.progress);
          yesterdayPhaseCounts[phase] = (yesterdayPhaseCounts[phase] || 0) + 1;
        });

        // Get the most voted phases
        const todayPhase =
          Object.entries(todayPhaseCounts).length > 0
            ? Object.entries(todayPhaseCounts).reduce((a, b) =>
                b[1] > a[1] ? b : a
              )[0]
            : '';

        const yesterdayPhase =
          Object.entries(yesterdayPhaseCounts).length > 0
            ? Object.entries(yesterdayPhaseCounts).reduce((a, b) =>
                b[1] > a[1] ? b : a
              )[0]
            : '';

        // Compare phase positions to determine trend
        const todayPos = getPhasePosition(todayPhase);
        const yesterdayPos = getPhasePosition(yesterdayPhase);
        const trend = !yesterdayPhase
          ? 'same'
          : todayPos > yesterdayPos
          ? 'up'
          : todayPos < yesterdayPos
          ? 'down'
          : 'same';

        setSummary({
          totalVotes: todayVotes.length,
          todayPhase: todayPhase || 'Waiting for votes',
          yesterdayPhase,
          trend,
        });

        setData(newData);
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
          Current sentiment:{' '}
          <span style={{ color: phaseColors[summary.todayPhase as Phase] }}>
            {summary.todayPhase}
          </span>
        </>
      );

    // Always show the movement, even if it's the same phase
    return (
      <>
        Market sentiment{' '}
        {summary.trend === 'same'
          ? 'stayed at'
          : 'moved ' + summary.trend + ' to'}{' '}
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
        <p className="hidden sm:block text-sm text-center text-orange-500 font-bold">
          Click on the chart to select your market sentiment and vote to see the
          collective sentiment.
        </p>
      )}
      <div className="text-center space-y-2 px-4 sm:px-0">
        <p className="hidden sm:block text-sm text-muted-foreground dark:text-white">
          {formatDate(new Date())}
        </p>
        <p className="text-xs text-muted-foreground dark:text-gray-400">
          Total votes today: {summary.totalVotes}
        </p>
        <p className="text-sm font-medium text-muted-foreground dark:text-white">
          {getSentimentDescription()}
        </p>
      </div>
      <div className="w-full sm:mx-0">
        <div className="min-w-[320px]  sm:px-0">
          <ChartContainer
            config={chartConfig}
            className="h-[300px] sm:h-[500px] w-full"
          >
            <ComposedChart
              data={data}
              margin={{
                top: 40,
                right: 30,
                left: 35,
                bottom: 60,
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
                      <div className="bg-black/80 p-2 rounded-md text-xs">
                        <p className="font-bold text-white">{data.phase}</p>
                        <p className="text-gray-200 whitespace-pre-line">
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
                  const { cx, cy, payload } = props;
                  const width = payload.phase.length > 8 ? 80 : 70;
                  return (
                    <g className="hidden sm:block">
                      <rect
                        x={cx - width / 2}
                        y={cy - 25}
                        width={width}
                        height={20}
                        fill="rgba(0,0,0,0.75)"
                        rx={4}
                      />
                      <text
                        x={cx}
                        y={cy - 12}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                        className="select-none"
                      >
                        {payload.phase}
                      </text>
                    </g>
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
      </div>
    </div>
  );
}
