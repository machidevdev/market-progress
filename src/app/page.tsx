'use client';

import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/LineChart';

export default function Home() {
  const [progress, setProgress] = useState(65);
  const [averageSentiment, setAverageSentiment] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setHasVoted] = useState(false);
  const [, setLastVoteDate] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getTodayUTC = () => {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString();
  };

  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        setIsLoading(true);
        const lastVote = localStorage.getItem('lastVoteDate');
        const today = getTodayUTC();

        if (lastVote === today) {
          setHasVoted(true);
          setLastVoteDate(lastVote);
          setShowResults(true);
        } else {
          const response = await fetch('/api/sentiment/check');
          const { hasVoted } = await response.json();
          if (hasVoted) {
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Failed to check vote status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVoteStatus();
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      const today = getTodayUTC();
      localStorage.setItem('lastVoteDate', today);
      setHasVoted(true);
      setLastVoteDate(today);
      setShowResults(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to submit vote. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhaseSelect = (phase: string) => {
    const phaseToProgress = {
      Disbelief: 5,
      Hope: 15,
      Optimism: 25,
      Belief: 35,
      Euphoria: 45,
      Complacency: 55,
      Anxiety: 65,
      Denial: 75,
      Panic: 85,
      Capitulation: 92,
      Anger: 96,
      Depression: 99,
    };
    setProgress(phaseToProgress[phase as keyof typeof phaseToProgress]);
    setSelectedPhase(phase);
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center p-4 sm:p-8 bg-black ${
        !showResults && 'justify-center'
      }`}
    >
      <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-6 sm:space-y-8">
        <div className="space-y-4 w-full text-center">
          <h1 className="text-2xl font-bold dark:text-white">
            Bull Market Progress
          </h1>
          <div className="text-sm dark:text-gray-400">
            <p>
              Help track the market sentiment by submitting your view on the
              current progress. To do this, click on the chart to select your
              sentiment and vote.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="w-full h-[500px] flex items-center justify-center">
            <div className="text-white text-lg">Loading chart...</div>
          </div>
        ) : !showResults ? (
          <div className="w-full space-y-6 flex justify-center flex-col">
            <LineChart onVote={handlePhaseSelect} isVoting={true} />
            {selectedPhase && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-black/50 px-6 py-3 rounded-lg">
                  <p className="text-white text-lg">
                    Selected phase:{' '}
                    <span className="font-bold">{selectedPhase}</span>
                  </p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-40 h-12 text-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Vote'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            <LineChart isVoting={false} />
            {averageSentiment > 0 && (
              <div className="space-y-2 max-w-xl mx-auto mt-4">
                <Progress
                  value={averageSentiment}
                  className="h-4 rounded-none [&>div]:rounded-none [&>div]:bg-white [&>div]:animate-progress-stripes [&>div]:bg-[length:20px_20px] [&>div]:bg-gradient-to-r [&>div]:from-white/50 [&>div]:to-transparent"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <a
        href="https://twitter.com/machiuwuowo"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Feedback
      </a>
    </div>
  );
}
