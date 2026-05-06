import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STUDENT_CLASSES, type School, type UserFormData, type UserRole } from "./user-management-types";

const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 appearance-none";

const ChevronIcon = () => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
    </div>
);

interface SchoolCheckboxListProps {
    availableSchools: School[];
    selectedIds: string[];
    prefix: string;
    onToggle: (id: string, checked: boolean) => void;
}

const SchoolCheckboxList = ({ availableSchools, selectedIds, prefix, onToggle }: SchoolCheckboxListProps) => (
    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 mt-1.5 bg-white">
        {availableSchools.length === 0 ? (
            <p className="text-sm text-gray-500">No schools available.</p>
        ) : (
            availableSchools.map((school) => (
                <div key={school.id} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id={`${prefix}school-${school.id}`}
                        checked={selectedIds.includes(school.id)}
                        onChange={(e) => onToggle(school.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${prefix}school-${school.id}`} className="text-sm cursor-pointer select-none">
                        {school.name}
                    </label>
                </div>
            ))
        )}
    </div>
);

interface UserFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    formData: UserFormData;
    onFormChange: (data: UserFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    availableSchools: School[];
}

export const UserFormDialog = ({
    open,
    onOpenChange,
    mode,
    formData,
    onFormChange,
    onSubmit,
    onCancel,
    availableSchools,
}: UserFormDialogProps) => {
    const isCreate = mode === 'create';
    const prefix = isCreate ? '' : 'edit-';
    const set = (patch: Partial<UserFormData>) => onFormChange({ ...formData, ...patch });
    const toggleSchool = (id: string, checked: boolean) =>
        set({ school_ids: checked ? [...formData.school_ids, id] : formData.school_ids.filter((s) => s !== id) });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isCreate ? 'Create New User' : 'Edit User'}</DialogTitle>
                    <DialogDescription>
                        {isCreate ? 'Add a new user to the system' : 'Update user information'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor={`${prefix}username`}>Username *</Label>
                            <Input id={`${prefix}username`} value={formData.username} onChange={(e) => set({ username: e.target.value })} required />
                        </div>

                        <div>
                            <Label htmlFor={`${prefix}email`}>Email *</Label>
                            <Input id={`${prefix}email`} type="email" value={formData.email} onChange={(e) => set({ email: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`${prefix}first_name`}>Sir Name</Label>
                                <Input id={`${prefix}first_name`} value={formData.first_name} onChange={(e) => set({ first_name: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor={`${prefix}last_name`}>Other Name</Label>
                                <Input id={`${prefix}last_name`} value={formData.last_name} onChange={(e) => set({ last_name: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor={`${prefix}role`}>Role *</Label>
                            <div className="relative">
                                <select id={`${prefix}role`} value={formData.role} onChange={(e) => set({ role: e.target.value as UserRole })} className={SELECT_CLASS}>
                                    <option value="learner">Learner</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="parent">Parent</option>
                                    <option value="program_manager">Program Manager</option>
                                    <option value="admin">Admin</option>
                                    <option value="curriculum_designer">Curriculum Designer</option>
                                </select>
                                <ChevronIcon />
                            </div>
                        </div>

                        {formData.role === 'learner' && (
                            <div>
                                <Label htmlFor={`${prefix}current_class`}>Current Class/Grade</Label>
                                <div className="relative mt-1.5">
                                    <select id={`${prefix}current_class`} value={formData.current_class} onChange={(e) => set({ current_class: e.target.value })} className={SELECT_CLASS}>
                                        <option value="">Select class/grade...</option>
                                        <optgroup label="Primary School">
                                            {STUDENT_CLASSES.slice(0, 7).map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                                        </optgroup>
                                        <optgroup label="Secondary School">
                                            {STUDENT_CLASSES.slice(7, 13).map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                                        </optgroup>
                                        <optgroup label="Grades">
                                            {STUDENT_CLASSES.slice(13).map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                                        </optgroup>
                                    </select>
                                    <ChevronIcon />
                                </div>
                            </div>
                        )}

                        {formData.role === 'teacher' && (
                            <div>
                                <Label>Assigned Schools</Label>
                                <SchoolCheckboxList
                                    availableSchools={availableSchools}
                                    selectedIds={formData.school_ids}
                                    prefix={prefix}
                                    onToggle={toggleSchool}
                                />
                                <p className="text-xs text-gray-500 mt-1">Select one or more schools for this teacher.</p>
                            </div>
                        )}

                        <div>
                            <Label htmlFor={`${prefix}password`}>
                                {isCreate ? 'Password *' : 'New Password (leave blank to keep current)'}
                            </Label>
                            <Input
                                id={`${prefix}password`}
                                type="password"
                                value={formData.password}
                                onChange={(e) => set({ password: e.target.value })}
                                required={isCreate}
                                placeholder={isCreate ? '' : 'Leave blank to keep current password'}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit">{isCreate ? 'Create User' : 'Update User'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
