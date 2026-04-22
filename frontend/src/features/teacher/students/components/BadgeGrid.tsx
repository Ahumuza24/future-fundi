import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Calendar, Medal } from 'lucide-react';
import type { TeacherBadgeItem } from '../types';

interface BadgeGridProps {
  badges: TeacherBadgeItem[];
}

export const BadgeGrid = ({ badges }: BadgeGridProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Medal className="h-5 w-5 text-fundi-orange" />
        Badges Earned
      </CardTitle>
      <CardDescription>Recognition and achievements</CardDescription>
    </CardHeader>
    <CardContent>
      {badges.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-fundi-orange"
                >
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg">{badge.badge_name}</h3>
                  {badge.description ? <p className="text-sm text-gray-600 mt-1">{badge.description}</p> : null}
                  {badge.module_name ? (
                    <p className="text-xs text-gray-500 mt-2">Module: {badge.module_name}</p>
                  ) : null}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(badge.awarded_at).toLocaleDateString()}
                    <span>•</span>
                    <span>by {badge.awarded_by_name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Medal className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No badges earned yet</p>
        </div>
      )}
    </CardContent>
  </Card>
);
