'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flame, Calendar, Star } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'streak' | 'goal' | 'milestone' | 'consistency';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementTrackerProps {
  achievements: Achievement[];
  streakDays: number;
  goalsMetToday: number;
  totalGoals: number;
  weeklyConsistency: number;
  animated?: boolean;
}

export default function AchievementTracker({
  achievements,
  streakDays,
  goalsMetToday,
  totalGoals,
  weeklyConsistency,
  animated = true,
}: AchievementTrackerProps) {
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked = achievements.find(a => 
      a.unlocked && a.unlockedAt && 
      Date.now() - a.unlockedAt.getTime() < 5000 // Within last 5 seconds
    );
    
    if (newlyUnlocked && animated) {
      setCelebratingAchievement(newlyUnlocked);
      setTimeout(() => setCelebratingAchievement(null), 3000);
    }
  }, [achievements, animated]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 border-gray-200';
      case 'rare': return 'text-blue-600 border-blue-200';
      case 'epic': return 'text-purple-600 border-purple-200';
      case 'legendary': return 'text-yellow-600 border-yellow-200';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'streak': return <Flame className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      case 'milestone': return <Trophy className="w-4 h-4" />;
      case 'consistency': return <Calendar className="w-4 h-4" />;
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const inProgressAchievements = achievements.filter(a => !a.unlocked && a.progress > 0);
  const lockedAchievements = achievements.filter(a => !a.unlocked && a.progress === 0);

  return (
    <div className="space-y-6">
      {/* Achievement Celebration Modal */}
      {celebratingAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border rounded-lg p-8 text-center max-w-md mx-4 animate-in zoom-in-95 duration-300">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Achievement Unlocked!</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              {celebratingAchievement.icon}
              <span className="font-semibold">{celebratingAchievement.title}</span>
            </div>
            <p className="text-muted-foreground">{celebratingAchievement.description}</p>
            <Badge className={`mt-4 ${getRarityColor(celebratingAchievement.rarity)}`}>
              {celebratingAchievement.rarity.toUpperCase()}
            </Badge>
          </div>
        </div>
      )}

      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{streakDays}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{goalsMetToday}/{totalGoals}</div>
            <div className="text-sm text-muted-foreground">Goals Today</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{weeklyConsistency}%</div>
            <div className="text-sm text-muted-foreground">Weekly Consistency</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
            <div className="text-sm text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Unlocked Achievements ({unlockedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`p-4 border rounded-lg ${getRarityColor(achievement.rarity)} bg-gradient-to-r from-transparent to-current/5`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-muted-foreground">
                          Unlocked {achievement.unlockedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-500" />
              In Progress ({inProgressAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressAchievements.map(achievement => {
                const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
                
                return (
                  <div key={achievement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        {getCategoryIcon(achievement.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements (Preview) */}
      {lockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border-2 border-dashed border-muted-foreground" />
              Locked Achievements ({lockedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lockedAchievements.slice(0, 4).map(achievement => (
                <div
                  key={achievement.id}
                  className="p-4 border rounded-lg opacity-50 hover:opacity-75 transition-opacity"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 grayscale">
                      {getCategoryIcon(achievement.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">???</h4>
                        <Badge variant="outline" className="text-xs">
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Keep progressing to unlock this achievement!
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lockedAchievements.length > 4 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                +{lockedAchievements.length - 4} more achievements to discover
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}