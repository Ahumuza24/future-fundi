import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Download, Upload, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { UserFilters } from "./components/UserFilters";
import { UserTable } from "./components/UserTable";
import { UserFormDialog } from "./components/UserFormDialog";
import { UserBulkImportDialog } from "./components/UserBulkImportDialog";
import type { ManagedUser, School, UserStats, UserFormData } from "./components/user-management-types";

const EMPTY_FORM: UserFormData = {
    username: '', email: '', first_name: '', last_name: '',
    role: 'learner', password: '', is_active: true, school_ids: [], current_class: '',
};

const EMPTY_STATS: UserStats = {
    total_users: 0, active_users: 0, inactive_users: 0,
    role_distribution: {}, recent_registrations_30d: 0, active_today: 0,
};

const STAT_CARDS = [
    { key: 'total_users' as const, label: 'Total Users', border: 'border-l-blue-500', text: 'text-blue-600' },
    { key: 'active_users' as const, label: 'Active Users', border: 'border-l-green-500', text: 'text-green-600' },
    { key: 'active_today' as const, label: 'Active Today', border: 'border-l-orange-500', text: 'text-orange-600' },
    { key: 'recent_registrations_30d' as const, label: 'New (30 days)', border: 'border-l-purple-500', text: 'text-purple-600' },
];

export default function UserManagement() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const [availableSchools, setAvailableSchools] = useState<School[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [schoolFilter, setSchoolFilter] = useState("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchSchools = useCallback(async () => {
        try {
            const res = await adminApi.tenants.getAll();
            setAvailableSchools(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch { /* schools are optional context; silently ignore */ }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | boolean> = {};
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
            if (schoolFilter !== 'all') params.school = schoolFilter;
            const res = await adminApi.users.getAll(params);
            setUsers(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch {
            showMessage('error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [roleFilter, schoolFilter, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await adminApi.users.stats();
            setStats(res?.data ?? EMPTY_STATS);
        } catch {
            setStats(EMPTY_STATS);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();
        void fetchStats();
        void fetchSchools();
    }, [fetchUsers, fetchStats, fetchSchools]);

    const buildPayload = (): UserFormData | null => {
        const payload = { ...formData };
        if (payload.role === 'teacher') {
            const ids = new Set(payload.school_ids);
            if (selectedUser?.role === 'teacher' && ids.size === 0 && selectedUser.tenant?.id) {
                ids.add(selectedUser.tenant.id);
            }
            payload.school_ids = Array.from(ids);
            if (payload.school_ids.length === 0) {
                showMessage('error', 'Please assign at least one school to this teacher');
                return null;
            }
        }
        if (!payload.password) delete (payload as Partial<UserFormData>).password;
        return payload;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = buildPayload();
            if (!payload) return;
            await adminApi.users.create(payload);
            showMessage('success', 'User created successfully');
            setIsCreateOpen(false);
            resetForm();
            void fetchUsers(); void fetchStats();
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showMessage('error', msg ?? 'Failed to create user');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            const payload = buildPayload();
            if (!payload) return;
            await adminApi.users.update(selectedUser.id, payload);
            showMessage('success', 'User updated successfully');
            setIsEditOpen(false);
            resetForm();
            void fetchUsers();
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showMessage('error', msg ?? 'Failed to update user');
        }
    };

    const handleDelete = async (user: ManagedUser) => {
        const isPermanent = !user.is_active;
        const action = isPermanent ? 'permanently delete' : 'deactivate';
        if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;
        try {
            await adminApi.users.delete(user.id, { permanent: isPermanent });
            showMessage('success', `User ${isPermanent ? 'deleted' : 'deactivated'} successfully`);
            void fetchUsers(); void fetchStats();
        } catch {
            showMessage('error', `Failed to ${action} user`);
        }
    };

    const handleExport = async () => {
        try {
            const params: Record<string, string | boolean> = {};
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
            const res = await adminApi.users.export(params);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showMessage('success', 'Users exported successfully');
        } catch {
            showMessage('error', 'Failed to export users');
        }
    };

    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        const fileInput = document.getElementById('bulk-import-file') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (!file) { showMessage('error', 'Please select a CSV file'); return; }
        try {
            const res = await adminApi.users.bulkImport(file);
            const { created, errors } = res.data;
            const hasErrors = errors?.length > 0;
            showMessage(
                hasErrors ? 'error' : 'success',
                hasErrors ? `Imported ${created} users with ${errors.length} errors` : `Successfully imported ${created} users`,
            );
            setIsBulkImportOpen(false);
            void fetchUsers(); void fetchStats();
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            showMessage('error', msg ?? 'Failed to import users');
        }
    };

    const resetForm = () => { setFormData(EMPTY_FORM); setSelectedUser(null); };

    const openEditDialog = (user: ManagedUser) => {
        const schoolIds = new Set((user.schools ?? []).map((s) => s.id));
        if (user.role === 'teacher' && user.tenant?.id) schoolIds.add(user.tenant.id);
        setSelectedUser(user);
        setFormData({
            username: user.username, email: user.email,
            first_name: user.first_name, last_name: user.last_name,
            role: user.role, password: '', is_active: user.is_active,
            school_ids: Array.from(schoolIds), current_class: user.current_class ?? '',
        });
        setIsEditOpen(true);
    };

    const filteredUsers = users.filter((u) =>
        [u.username, u.email, u.first_name, u.last_name]
            .some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && users.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-fundi-cyan mx-auto mb-4" />
                    <p className="text-gray-500">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl font-bold text-fundi-black">User Management</h1>
                        <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2">
                            <Upload className="h-4 w-4" /> Import
                        </Button>
                        <Button variant="outline" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" /> Export
                        </Button>
                        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-2">
                            <UserPlus className="h-4 w-4" /> Add User
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className={`p-4 rounded-lg border flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                        >
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map(({ key, label, border, text }) => (
                        <Card key={key} className={`border-l-4 ${border}`}>
                            <CardHeader className="pb-3">
                                <CardDescription>{label}</CardDescription>
                                <CardTitle className={`text-3xl ${text}`}>{stats[key]}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <UserFilters
                    searchTerm={searchTerm} onSearchChange={setSearchTerm}
                    roleFilter={roleFilter} onRoleChange={setRoleFilter}
                    statusFilter={statusFilter} onStatusChange={setStatusFilter}
                    schoolFilter={schoolFilter} onSchoolChange={setSchoolFilter}
                    availableSchools={availableSchools}
                />

                <UserTable users={filteredUsers} onEdit={openEditDialog} onDelete={handleDelete} />

                <UserFormDialog
                    open={isCreateOpen} onOpenChange={setIsCreateOpen} mode="create"
                    formData={formData} onFormChange={setFormData}
                    onSubmit={handleCreate} onCancel={() => { setIsCreateOpen(false); resetForm(); }}
                    availableSchools={availableSchools}
                />

                <UserFormDialog
                    open={isEditOpen} onOpenChange={setIsEditOpen} mode="edit"
                    formData={formData} onFormChange={setFormData}
                    onSubmit={handleUpdate} onCancel={() => { setIsEditOpen(false); resetForm(); }}
                    availableSchools={availableSchools}
                />

                <UserBulkImportDialog
                    open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen} onSubmit={handleBulkImport}
                />
            </div>
        </div>
    );
}
