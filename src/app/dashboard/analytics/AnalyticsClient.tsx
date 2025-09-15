'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedLineChart from '@/components/charts/EnhancedLineChart';
import ProgressRing from '@/components/charts/ProgressRing';
import MacroBreakdownChart from '@/components/charts/MacroBreakdownChart';
import TrendsChart from '@/components/charts/TrendsChart';
import AchievementTracker from '@/components/charts/AchievementTracker';
import { Trophy, Target, Flame, Calendar, Star, Award } from 'lucide-react';

interface DailyData {
  date: string;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  target: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } | null;
}

interface AnalyticsClientProps {
  dailyData: DailyData[];
  currentStreak: number;
  weeklyConsistency: number;
  goalsMetToday: number;
}

export default function AnalyticsClient({
  dailyData,
  currentStreak,
  weeklyConsistency,
  goalsMetToday,
}: AnalyticsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  // Get data for selected period
  const getPeriodData = () => {
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    return dailyData.slice(-days);
  };

  const periodData = getPeriodData();
  const todayData = dailyData[dailyData.length - 1];

  // Prepare chart data
  const chartData = periodData.map(d => ({
    date: d.date,
    value: d.consumed[selectedMetric],
    target: d.target?.[selectedMetric],
  }));

  // Prepare trends data
  const trendsData = periodData.map(d => ({
    date: d.date,
    calories: d.consumed.calories,
    protein: d.consumed.protein,
    carbs: d.consumed.carbs,
    fat: d.consumed.fat,
  }));

  // Sample achievements data
  const achievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Log your first meal',
      icon: <Target className="w-5 h-5" />,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 86400000), // Yesterday
      category: 'milestone' as const,
      rarity: 'common' as const,
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Log meals for 7 consecutive days',
      icon: <Flame className="w-5 h-5" />,
      progress: currentStreak,
      maxProgress: 7,
      unlocked: currentStreak >= 7,
      unlockedAt: currentStreak >= 7 ? new Date() : undefined,
      category: 'streak' as const,
      rarity: 'rare' as const,
    },
    {
      id: '3',
      title: 'Goal Getter',
      description: 'Meet all macro goals in a single day',
      icon: <Trophy className="w-5 h-5" />,
      progress: goalsMetToday,
      maxProgress: 4,
      unlocked: goalsMetToday >= 4,
      category: 'goal' as const,
      rarity: 'epic' as const,
    },
    {
      id: '4',
      title: 'Consistency King',
      description: 'Maintain 90% weekly consistency for a month',
      icon: <Calendar className="w-5 h-5" />,
      progress: weeklyConsistency >= 90 ? 1 : 0,
      maxProgress: 4,
      unlocked: false,
      category: 'consistency' as const,
      rarity: 'legendary' as const,
    },
  ];

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
        <TabsTrigger value="macros">Macros</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Period Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Nutrition Overview</h2>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Today's Progress Ring */}
        {todayData && todayData.target && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ProgressRing
                value={todayData.consumed.calories}
                target={todayData.target.calories}
                label="calories"
                unit="kcal"
                size={250}
                animated={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Metric Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Nutrition Tracking</CardTitle>
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calories">Calories</SelectItem>
                  <SelectItem value="protein">Protein</SelectItem>
                  <SelectItem value="carbs">Carbs</SelectItem>
                  <SelectItem value="fat">Fat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <EnhancedLineChart
              data={chartData}
              title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Tracking`}
              dataKey={selectedMetric}
              unit={selectedMetric === 'calories' ? 'kcal' : 'g'}
              height={400}
              exportable={true}
              animated={true}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="trends" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Trends Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendsChart
              data={trendsData}
              period={selectedPeriod}
              metrics={['calories', 'protein', 'carbs', 'fat']}
              showMovingAverage={true}
              height={500}
              animated={true}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="macros" className="space-y-6">
        {todayData && todayData.target && (
          <>
            {/* Macro Breakdown Doughnut */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Macro Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <MacroBreakdownChart
                  consumed={{
                    protein: todayData.consumed.protein,
                    carbs: todayData.consumed.carbs,
                    fat: todayData.consumed.fat,
                    fiber: todayData.consumed.fiber,
                  }}
                  target={{
                    protein: todayData.target.protein,
                    carbs: todayData.target.carbs,
                    fat: todayData.target.fat,
                    fiber: todayData.target.fiber,
                  }}
                  type="doughnut"
                  showCalories={true}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Macro Comparison Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Macro Goals Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <MacroBreakdownChart
                  consumed={{
                    protein: todayData.consumed.protein,
                    carbs: todayData.consumed.carbs,
                    fat: todayData.consumed.fat,
                    fiber: todayData.consumed.fiber,
                  }}
                  target={{
                    protein: todayData.target.protein,
                    carbs: todayData.target.carbs,
                    fat: todayData.target.fat,
                    fiber: todayData.target.fiber,
                  }}
                  type="bar"
                  showCalories={false}
                  height={400}
                />
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="achievements" className="space-y-6">
        <AchievementTracker
          achievements={achievements}
          streakDays={currentStreak}
          goalsMetToday={goalsMetToday}
          totalGoals={4}
          weeklyConsistency={weeklyConsistency}
          animated={true}
        />
      </TabsContent>
    </Tabs>
  );
}