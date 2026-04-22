import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar, School, GraduationCap, CheckCircle, AlertCircle, Edit, Trash2 } from "lucide-react";
import type { Child } from "./child-management-types";

interface ChildCardProps {
    child: Child;
    onEdit: (child: Child) => void;
    onDelete: (id: string, name: string) => void;
}

export function ChildCard({ child, onEdit, onDelete }: ChildCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-fundi-orange/10">
                            <User className="h-6 w-6 text-fundi-orange" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{child.full_name}</CardTitle>
                            {child.age && (
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {child.age} years old
                                </p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-4">
                        {child.current_school && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <School className="h-4 w-4 text-blue-600" />
                                {child.current_school}
                            </div>
                        )}
                        {child.current_class && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <GraduationCap className="h-4 w-4 text-purple-600" />
                                {child.current_class}
                            </div>
                        )}
                        {child.consent_media && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Media consent given
                            </div>
                        )}
                        {child.equity_flag && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <AlertCircle className="h-4 w-4" />
                                Additional support
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => onEdit(child)}
                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                            onClick={() => onDelete(child.id, child.full_name)}
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
