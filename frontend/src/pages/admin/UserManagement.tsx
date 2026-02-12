import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users, UserPlus, Search, Filter, Download, Upload,
    Edit, Trash2, CheckCircle, XCircle, RefreshCw, AlertCircle
} from "lucide-react";
import { adminApi, courseApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const STUDENT_CLASSES = [
    "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7",
    "S.1", "S.2", "S.3", "S.4", "S.5", "S.6",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'learner' | 'teacher' | 'parent' | 'leader' | 'admin';
    is_active: boolean;
    tenant?: {
        id: string;
        name: string;
    };
    date_joined: string;
    last_login: string | null;
    pathways?: string[]; // Add pathways field
    current_class?: string;
}

interface Course {
    id: string;
    name: string;
}

interface UserStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    role_distribution: Record<string, number>;
    recent_registrations_30d: number;
    active_today: number;
}

const roleColors: Record<string, { bg: string; text: string }> = {
    learner: { bg: 'bg-blue-100', text: 'text-blue-700' },
    teacher: { bg: 'bg-green-100', text: 'text-green-700' },
    parent: { bg: 'bg-purple-100', text: 'text-purple-700' },
    leader: { bg: 'bg-orange-100', text: 'text-orange-700' },
    admin: { bg: 'bg-red-100', text: 'text-red-700' },
    data_entry: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
};

// Helper function to get role colors with fallback
const getRoleColors = (role: string) => {
    return roleColors[role] || { bg: 'bg-gray-100', text: 'text-gray-700' };
};

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [availablePathways, setAvailablePathways] = useState<Course[]>([]); // Store available pathways

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'learner' as User['role'],
        password: '',
        is_active: true,
        pathway_ids: [] as string[], // Add pathway_ids state
        current_class: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchStats();
        fetchPathways(); // Fetch pathways on load
    }, [roleFilter, statusFilter]);

    const fetchPathways = async () => {
        try {
            const response = await courseApi.getAll();
            setAvailablePathways(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch pathways:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

            const response = await adminApi.users.getAll(params);
            setUsers(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showMessage('error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminApi.users.stats();
            // Validate response structure
            if (response?.data) {
                setStats(response.data);
            } else {
                console.error('Invalid stats response structure:', response);
                // Set default empty stats to prevent crashes
                setStats({
                    total_users: 0,
                    active_users: 0,
                    inactive_users: 0,
                    role_distribution: {},
                    recent_registrations_30d: 0,
                    active_today: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Set default empty stats to prevent crashes
            setStats({
                total_users: 0,
                active_users: 0,
                inactive_users: 0,
                role_distribution: {},
                recent_registrations_30d: 0,
                active_today: 0
            });
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.users.create(formData);
            showMessage('success', 'User created successfully');
            setIsCreateDialogOpen(false);
            resetForm();
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            const apiError = error as { response?: { data?: { message?: string } } };
            showMessage('error', apiError.response?.data?.message || 'Failed to create user');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            await adminApi.users.update(selectedUser.id, formData);
            showMessage('success', 'User updated successfully');
            setIsEditDialogOpen(false);
            resetForm();
            fetchUsers();
        } catch (error: any) {
            const apiError = error as { response?: { data?: { message?: string } } };
            showMessage('error', apiError.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDelete = async (user: User) => {
        const isPermanent = !user.is_active;
        const action = isPermanent ? 'permanently delete' : 'deactivate';
        const warning = isPermanent ? 'This action cannot be undone!' : 'This will disable their access.';

        if (!confirm(`Are you sure you want to ${action} user "${user.username}"?\n\n${warning}`)) return;

        try {
            await adminApi.users.delete(user.id, { permanent: isPermanent });
            showMessage('success', `User ${isPermanent ? 'deleted' : 'deactivated'} successfully`);
            fetchUsers();
            fetchStats();
        } catch (error) {
            showMessage('error', `Failed to ${action} user`);
        }
    };

    const handleExport = async () => {
        try {
            const params: any = {};
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

            const response = await adminApi.users.export(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showMessage('success', 'Users exported successfully');
        } catch (error) {
            showMessage('error', 'Failed to export users');
        }
    };

    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        const fileInput = document.getElementById('bulk-import-file') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        if (!file) {
            showMessage('error', 'Please select a CSV file');
            return;
        }

        try {
            const response = await adminApi.users.bulkImport(file);
            const { created, errors } = response.data;

            if (errors && errors.length > 0) {
                showMessage('error', `Imported ${created} users with ${errors.length} errors`);
                console.error('Import errors:', errors);
            } else {
                showMessage('success', `Successfully imported ${created} users`);
            }

            setIsBulkImportOpen(false);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            const apiError = error as { response?: { data?: { error?: string } } };
            showMessage('error', apiError.response?.data?.error || 'Failed to import users');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            role: 'learner',
            password: '',
            is_active: true,
            pathway_ids: [],
            current_class: '',
        });
        setSelectedUser(null);
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            password: '',
            is_active: user.is_active,
            pathway_ids: user.pathways || [], // Populate existing pathways
            current_class: user.current_class || '',
        });
        setIsEditDialogOpen(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    if (loading && users.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-[var(--fundi-cyan)] mx-auto mb-4" />
                    <p className="text-gray-500">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl font-bold text-[var(--fundi-black)]">
                            User Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage users, roles, and permissions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBulkImportOpen(true)}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Import
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </div>

                {/* Message Banner */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`p-4 rounded-lg border ${message.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {message.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                                <CardDescription>Total Users</CardDescription>
                                <CardTitle className="text-3xl text-blue-600">
                                    {stats.total_users}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-3">
                                <CardDescription>Active Users</CardDescription>
                                <CardTitle className="text-3xl text-green-600">
                                    {stats.active_users}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500">
                            <CardHeader className="pb-3">
                                <CardDescription>Active Today</CardDescription>
                                <CardTitle className="text-3xl text-orange-600">
                                    {stats.active_today}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="pb-3">
                                <CardDescription>New (30 days)</CardDescription>
                                <CardTitle className="text-3xl text-purple-600">
                                    {stats.recent_registrations_30d}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="learner">Learners</SelectItem>
                                    <SelectItem value="teacher">Teachers</SelectItem>
                                    <SelectItem value="parent">Parents</SelectItem>
                                    <SelectItem value="leader">Leaders</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Users ({filteredUsers.length})
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
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.username}</TableCell>
                                                <TableCell>{user.first_name} {user.last_name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColors(user.role).bg} ${getRoleColors(user.role).text}`}>
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {user.is_active ? (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle className="h-4 w-4" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-600">
                                                            <XCircle className="h-4 w-4" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy') : 'Never'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(user)}
                                                            className="text-red-600 hover:text-red-700"
                                                            title={user.is_active ? "Deactivate User" : "Permanently Delete User"}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Create User Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user to the system
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="role">Role *</Label>
                                    <div className="relative">
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        >
                                            <option value="learner">Learner</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="parent">Parent</option>
                                            <option value="leader">Leader</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {formData.role === 'learner' && (
                                    <div className="mt-4">
                                        <Label htmlFor="current_class">Current Class/Grade</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="current_class"
                                                value={formData.current_class}
                                                onChange={(e) => setFormData({ ...formData, current_class: e.target.value })}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                            >
                                                <option value="">Select class/grade...</option>
                                                <optgroup label="Primary School">
                                                    {STUDENT_CLASSES.slice(0, 7).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Secondary School">
                                                    {STUDENT_CLASSES.slice(7, 13).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Grades">
                                                    {STUDENT_CLASSES.slice(13).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.role === 'teacher' && (
                                    <div>
                                        <Label>Assigned Pathways (Courses)</Label>
                                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 mt-1.5 bg-white">
                                            {availablePathways.length === 0 ? (
                                                <p className="text-sm text-gray-500">No pathways available.</p>
                                            ) : (
                                                availablePathways.map(pathway => (
                                                    <div key={pathway.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`pathway-${pathway.id}`}
                                                            checked={formData.pathway_ids.includes(pathway.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    pathway_ids: checked
                                                                        ? [...(prev.pathway_ids || []), pathway.id]
                                                                        : (prev.pathway_ids || []).filter(id => id !== pathway.id)
                                                                }));
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor={`pathway-${pathway.id}`} className="text-sm cursor-pointer select-none">
                                                            {pathway.name}
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Select the pathways this teacher is qualified to teach.</p>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateDialogOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Create User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Update user information
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-username">Username *</Label>
                                    <Input
                                        id="edit-username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="edit-email">Email *</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-first_name">First Name</Label>
                                        <Input
                                            id="edit-first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="edit-last_name">Last Name</Label>
                                        <Input
                                            id="edit-last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="edit-role">Role *</Label>
                                    <div className="relative">
                                        <select
                                            id="edit-role"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        >
                                            <option value="learner">Learner</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="parent">Parent</option>
                                            <option value="leader">Leader</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {formData.role === 'learner' && (
                                    <div className="mt-4">
                                        <Label htmlFor="edit-current_class">Current Class/Grade</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="edit-current_class"
                                                value={formData.current_class}
                                                onChange={(e) => setFormData({ ...formData, current_class: e.target.value })}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                            >
                                                <option value="">Select class/grade...</option>
                                                <optgroup label="Primary School">
                                                    {STUDENT_CLASSES.slice(0, 7).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Secondary School">
                                                    {STUDENT_CLASSES.slice(7, 13).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Grades">
                                                    {STUDENT_CLASSES.slice(13).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.role === 'teacher' && (
                                    <div>
                                        <Label>Assigned Pathways (Courses)</Label>
                                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 mt-1.5 bg-white">
                                            {availablePathways.length === 0 ? (
                                                <p className="text-sm text-gray-500">No pathways available.</p>
                                            ) : (
                                                availablePathways.map(pathway => (
                                                    <div key={pathway.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`edit-pathway-${pathway.id}`}
                                                            checked={(formData.pathway_ids || []).includes(pathway.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    pathway_ids: checked
                                                                        ? [...(prev.pathway_ids || []), pathway.id]
                                                                        : (prev.pathway_ids || []).filter(id => id !== pathway.id)
                                                                }));
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor={`edit-pathway-${pathway.id}`} className="text-sm cursor-pointer select-none">
                                                            {pathway.name}
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Leave blank to keep current password"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Update User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Bulk Import Dialog */}
                <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Bulk Import Users</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to import multiple users at once
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBulkImport}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="bulk-import-file">CSV File</Label>
                                    <Input
                                        id="bulk-import-file"
                                        type="file"
                                        accept=".csv"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        CSV format: username,email,first_name,last_name,role,tenant_id,password
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Example CSV:</strong>
                                    </p>
                                    <pre className="text-xs mt-2 text-blue-600">
                                        username,email,first_name,last_name,role,password{'\n'}
                                        john.doe,john@example.com,John,Doe,teacher,Pass123!
                                    </pre>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBulkImportOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Import Users</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
