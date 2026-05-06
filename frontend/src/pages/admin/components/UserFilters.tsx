import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { School } from "./user-management-types";

interface UserFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    schoolFilter: string;
    onSchoolChange: (value: string) => void;
    availableSchools: School[];
}

export const UserFilters = ({
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleChange,
    statusFilter,
    onStatusChange,
    schoolFilter,
    onSchoolChange,
    availableSchools,
}: UserFiltersProps) => (
    <Card>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={roleFilter} onValueChange={onRoleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="learner">Learners</SelectItem>
                        <SelectItem value="teacher">Teachers</SelectItem>
                        <SelectItem value="parent">Parents</SelectItem>
                        <SelectItem value="program_manager">Program Managers</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="curriculum_designer">Curriculum Designers</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={schoolFilter} onValueChange={onSchoolChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by school" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Schools</SelectItem>
                        {availableSchools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                                {school.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
    </Card>
);
