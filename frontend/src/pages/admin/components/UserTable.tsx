import { Edit, Trash2, CheckCircle, XCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { getRoleColors, type ManagedUser } from "./user-management-types";

interface UserTableProps {
    users: ManagedUser[];
    onEdit: (user: ManagedUser) => void;
    onDelete: (user: ManagedUser) => void;
}

const SchoolCell = ({ user }: { user: ManagedUser }) => {
    if (user.role === 'teacher' && (user.schools?.length ?? 0) > 0) {
        const names = user.schools!.map((s) => s.name).join(', ');
        const label = user.schools!.length === 1
            ? user.schools![0].name
            : `${user.schools![0].name} +${user.schools!.length - 1}`;
        return <span className="text-sm text-gray-700" title={names}>{label}</span>;
    }
    if (user.tenant) {
        return <span className="text-sm text-gray-700">{user.tenant.name}</span>;
    }
    return <span className="text-xs text-gray-400">—</span>;
};

const StatusCell = ({ isActive }: { isActive: boolean }) =>
    isActive ? (
        <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" /> Active
        </span>
    ) : (
        <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" /> Inactive
        </span>
    );

export const UserTable = ({ users, onEdit, onDelete }: UserTableProps) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({users.length})
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => {
                                const colors = getRoleColors(user.role);
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[160px]">
                                            <SchoolCell user={user} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusCell isActive={user.is_active} />
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {user.last_login
                                                ? format(new Date(user.last_login), 'MMM d, yyyy')
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(user)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title={user.is_active ? "Deactivate User" : "Permanently Delete User"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
);
