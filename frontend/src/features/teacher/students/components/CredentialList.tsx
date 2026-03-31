import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, GraduationCap } from 'lucide-react';
import type { TeacherCredentialItem } from '../types';

interface CredentialListProps {
  credentials: TeacherCredentialItem[];
}

export const CredentialList = ({ credentials }: CredentialListProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5" style={{ color: 'var(--fundi-purple)' }} />
        Microcredentials
      </CardTitle>
      <CardDescription>Completed certifications</CardDescription>
    </CardHeader>
    <CardContent>
      {credentials.length ? (
        <div className="space-y-3">
          {credentials.map((credential, index) => (
            <motion.div
              key={credential.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--fundi-purple)' }}
              >
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{credential.name}</h3>
                <p className="text-sm text-gray-600">Issued by: {credential.issuer}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(credential.issued_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No credentials earned yet</p>
        </div>
      )}
    </CardContent>
  </Card>
);
