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
    Building, Plus, Search, Edit, Trash2, Users,
    BookOpen, Activity, FileText, CheckCircle, XCircle,
    RefreshCw, AlertCircle, TrendingUp
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Tenant {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    created_at: string;
}

interface TenantStats {
    tenant_id: string;
    tenant_name: string;
    total_users: number;
    learners: number;
    teachers: number;
    parents: number;
    active_enrollments: number;
    total_sessions: number;
    total_artifacts: number;
}

export default function SchoolManagement() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        is_active: true,
    });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const response = await adminApi.tenants.getAll();
            setTenants(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
            showMessage('error', 'Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    const fetchTenantStats = async (tenantId: string) => {
        try {
            const response = await adminApi.tenants.stats(tenantId);
            setTenantStats(response.data);
            setIsStatsDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch tenant stats:', error);
            showMessage('error', 'Failed to load school statistics');
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.tenants.create(formData);
            showMessage('success', 'School created successfully');
            setIsCreateDialogOpen(false);
            resetForm();
            fetchTenants();
        } catch (error: any) {
            showMessage('error', error.response?.data?.message || 'Failed to create school');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        try {
            await adminApi.tenants.update(selectedTenant.id, formData);
            showMessage('success', 'School updated successfully');
            setIsEditDialogOpen(false);
            resetForm();
            fetchTenants();
        } catch (error: any) {
            showMessage('error', error.response?.data?.message || 'Failed to update school');
        }
    };

    const handleDelete = async (tenant: Tenant) => {
        if (!confirm(`Deactivate school "${tenant.name}"? This will disable access for all users in this school.`)) return;

        try {
            await adminApi.tenants.delete(tenant.id);
            showMessage('success', 'School deactivated successfully');
            fetchTenants();
        } catch (error) {
            showMessage('error', 'Failed to deactivate school');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            is_active: true,
        });
        setSelectedTenant(null);
    };

    const openEditDialog = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setFormData({
            name: tenant.name,
            code: tenant.code,
            is_active: tenant.is_active,
        });
        setIsEditDialogOpen(true);
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && tenants.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-[var(--fundi-cyan)] mx-auto mb-4" />
                    <p className="text-gray-500">Loading schools...</p>
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
                            School Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage schools and their settings
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add School
                    </Button>
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

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search schools..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Schools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTenants.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="py-12 text-center text-gray-500">
                                No schools found
                            </CardContent>
                        </Card>
                    ) : (
                        filteredTenants.map((tenant) => (
                            <motion.div
                                key={tenant.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[var(--fundi-cyan)]">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-cyan-100">
                                                    <Building className="h-6 w-6 text-[var(--fundi-cyan)]" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                                                    <CardDescription className="font-mono text-xs">
                                                        {tenant.code}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            {tenant.is_active ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => fetchTenantStats(tenant.id)}
                                            >
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Stats
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditDialog(tenant)}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(tenant)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create School Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New School</DialogTitle>
                            <DialogDescription>
                                Add a new school to the system
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">School Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Kampala Primary School"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="code">School Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., KPS001"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Unique identifier for the school
                                    </p>
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
                                <Button type="submit">Create School</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit School Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit School</DialogTitle>
                            <DialogDescription>
                                Update school information
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">School Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="edit-code">School Code *</Label>
                                    <Input
                                        id="edit-code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
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
                                <Button type="submit">Update School</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* School Statistics Dialog */}
                <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>School Statistics</DialogTitle>
                            <DialogDescription>
                                {tenantStats?.tenant_name}
                            </DialogDescription>
                        </DialogHeader>
                        {tenantStats && (
                            <div className="space-y-4">
                                {/* User Statistics */}
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Users
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-blue-600">{tenantStats.total_users}</p>
                                                <p className="text-xs text-gray-500">Total Users</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-green-600">{tenantStats.learners}</p>
                                                <p className="text-xs text-gray-500">Learners</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-purple-600">{tenantStats.teachers}</p>
                                                <p className="text-xs text-gray-500">Teachers</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-orange-600">{tenantStats.parents}</p>
                                                <p className="text-xs text-gray-500">Parents</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Activity Statistics */}
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Activity
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-cyan-600">{tenantStats.active_enrollments}</p>
                                                <p className="text-xs text-gray-500">Enrollments</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-indigo-600">{tenantStats.total_sessions}</p>
                                                <p className="text-xs text-gray-500">Sessions</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-4">
                                                <p className="text-2xl font-bold text-pink-600">{tenantStats.total_artifacts}</p>
                                                <p className="text-xs text-gray-500">Artifacts</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setIsStatsDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
