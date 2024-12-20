'use client';

import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LineChart } from '@/components/LineChart';

export default function Home() {
  const [progress, setProgress] = useState(65);
  const [averageSentiment, setAverageSentiment] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [, setLastVoteDate] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has voted today
    const lastVote = localStorage.getItem('lastVoteDate');
    const today = new Date().toDateString();

    if (lastVote === today) {
      setHasVoted(true);
      setLastVoteDate(lastVote);
    }
  }, []);

  useEffect(() => {
    const fetchAverageSentiment = async () => {
      try {
        const response = await fetch('/api/sentiment');
        const sentiments = await response.json();

        if (sentiments.length > 0) {
          const today = new Date().toDateString();
          const todaysSentiments = sentiments.filter(
            (s: { createdAt: string }) =>
              new Date(s.createdAt).toDateString() === today
          );

          if (todaysSentiments.length > 0) {
            const total = todaysSentiments.reduce(
              (acc: number, curr: { progress: number }) => acc + curr.progress,
              0
            );
            setAverageSentiment(Math.round(total / todaysSentiments.length));
          } else {
            setAverageSentiment(0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch average sentiment:', error);
      }
    };

    fetchAverageSentiment();
  }, [isSubmitting]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      // Save vote date to localStorage
      const today = new Date().toDateString();
      localStorage.setItem('lastVoteDate', today);
      setHasVoted(true);
      setLastVoteDate(today);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-black">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center dark:text-white">
            Bull Market Progress
          </h1>
          <div className="text-sm text-center space-y-2 dark:text-gray-400">
            <p>
              Help track the bull market sentiment by submitting your view on
              the current progress.
            </p>
            <ul className="text-xs space-y-1">
              <li>
                <span className="text-blue-400">0-30%:</span> Early bull market,
                accumulation phase
              </li>
              <li>
                <span className="text-green-400">30-70%:</span> Mid bull market,
                trending phase
              </li>
              <li>
                <span className="text-red-400">70-100%:</span> Late bull market,
                distribution phase
              </li>
            </ul>
            <p className="pt-2 font-medium">
              Average market sentiment: {averageSentiment}%
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Progress
              value={averageSentiment}
              className="h-4 rounded-none [&>div]:rounded-none [&>div]:bg-white [&>div]:animate-progress-stripes [&>div]:bg-[length:20px_20px] [&>div]:bg-gradient-to-r [&>div]:from-white/50 [&>div]:to-transparent"
            />
          </div>

          <div className="space-y-2">
            {hasVoted ? (
              <p className="text-sm text-center text-yellow-400">
                You have already voted today. Come back tomorrow!
              </p>
            ) : (
              <>
                <p className="text-sm text-center dark:text-gray-400">
                  Submit your sentiment
                </p>
                <Slider
                  value={[progress]}
                  onValueChange={(value) => setProgress(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-center font-medium dark:text-white">
                  {progress}%
                </p>
              </>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || hasVoted}
            className="w-full"
          >
            {isSubmitting
              ? 'Submitting...'
              : hasVoted
              ? 'Already Voted Today'
              : 'Submit Your View'}
          </Button>
        </div>

        <div className="mt-8 sm:mt-12 h-[250px] sm:h-[300px]">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-center dark:text-white">
            Historical Sentiment
          </h2>
          <LineChart />
        </div>
      </div>
    </div>
  );
}
