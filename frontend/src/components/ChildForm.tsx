import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, GraduationCap, Key } from "lucide-react";
import { PRIMARY_CLASSES, SECONDARY_CLASSES, GRADE_CLASSES } from "./child-management-types";
import type { Child, Course, ChildFormData } from "./child-management-types";

interface ChildFormProps {
    editingChild: Child | null;
    formData: ChildFormData;
    onChange: (data: ChildFormData) => void;
    courses: Course[];
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const INPUT_CLASS = "w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundi-orange";

export function ChildForm({ editingChild, formData, onChange, courses, onSubmit, onCancel }: ChildFormProps) {
    const set = (patch: Partial<ChildFormData>) => onChange({ ...formData, ...patch });
    const isCreate = !editingChild;

    return (
        <Card className="border-2 border-fundi-orange">
            <CardHeader>
                <CardTitle>{isCreate ? 'Add New Child' : 'Edit Child'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Sir Name</label>
                            <input type="text" value={formData.first_name} onChange={(e) => set({ first_name: e.target.value })} className={INPUT_CLASS} required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Other Name</label>
                            <input type="text" value={formData.last_name} onChange={(e) => set({ last_name: e.target.value })} className={INPUT_CLASS} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Date of Birth</label>
                        <input type="date" value={formData.date_of_birth} onChange={(e) => set({ date_of_birth: e.target.value })} className={INPUT_CLASS} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                <School className="h-4 w-4" /> Current School
                            </label>
                            <input type="text" value={formData.current_school} onChange={(e) => set({ current_school: e.target.value })} className={INPUT_CLASS} placeholder="e.g., Kampala Primary School" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" /> Current Class/Grade
                            </label>
                            <ClassSelect value={formData.current_class} onChange={(v) => set({ current_class: v })} />
                        </div>
                    </div>

                    {isCreate && <CredentialsSection formData={formData} set={set} />}
                    {!isCreate && <ChangePasswordSection formData={formData} set={set} />}

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="consent_media" checked={formData.consent_media} onChange={(e) => set({ consent_media: e.target.checked })} className="h-4 w-4" />
                        <label htmlFor="consent_media" className="text-sm">I consent to media capture (photos/videos) for educational purposes</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="equity_flag" checked={formData.equity_flag} onChange={(e) => set({ equity_flag: e.target.checked })} className="h-4 w-4" />
                        <label htmlFor="equity_flag" className="text-sm">My child requires additional support</label>
                    </div>

                    {isCreate && (
                        <PathwaySelector
                            courses={courses}
                            selectedIds={formData.pathway_ids ?? []}
                            onChange={(ids) => set({ pathway_ids: ids })}
                        />
                    )}

                    <div className="flex gap-3">
                        <Button type="submit" className="bg-fundi-orange text-white flex-1">
                            {isCreate ? 'Add Child' : 'Update Child'}
                        </Button>
                        <Button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function ClassSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT_CLASS} appearance-none bg-white`}>
                <option value="">Select class/grade...</option>
                <optgroup label="Primary School">
                    {PRIMARY_CLASSES.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </optgroup>
                <optgroup label="Secondary School">
                    {SECONDARY_CLASSES.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </optgroup>
                <optgroup label="Grades">
                    {GRADE_CLASSES.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
}

function CredentialsSection({ formData, set }: { formData: ChildFormData; set: (p: Partial<ChildFormData>) => void }) {
    return (
        <div className="pt-4 border-t-2 border-gray-200 space-y-4">
            <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-fundi-black">
                    <Key className="h-5 w-5" /> Student Login Credentials
                </h3>
                <p className="text-sm text-gray-600">Create a username and password for your child to log in to their student dashboard</p>
            </div>
            <div>
                <label className="block text-sm font-semibold mb-2">Username</label>
                <input type="text" value={formData.username ?? ''} onChange={(e) => set({ username: e.target.value })} className={INPUT_CLASS} placeholder="e.g., child_username" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Password</label>
                    <input type="password" value={formData.password ?? ''} onChange={(e) => set({ password: e.target.value })} className={INPUT_CLASS} placeholder="Min. 8 characters" minLength={8} required />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                    <input type="password" value={formData.password_confirm ?? ''} onChange={(e) => set({ password_confirm: e.target.value })} className={INPUT_CLASS} placeholder="Re-enter password" minLength={8} required />
                </div>
            </div>
        </div>
    );
}

function ChangePasswordSection({ formData, set }: { formData: ChildFormData; set: (p: Partial<ChildFormData>) => void }) {
    return (
        <div className="pt-4 border-t-2 border-gray-200 space-y-4">
            <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-fundi-black">
                    <Key className="h-5 w-5" /> Change Password (Optional)
                </h3>
                <p className="text-sm text-gray-600">Leave blank to keep the current password</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">New Password</label>
                    <input type="password" value={formData.new_password ?? ''} onChange={(e) => set({ new_password: e.target.value })} className={INPUT_CLASS} placeholder="Min. 8 characters" minLength={8} />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                    <input type="password" value={formData.new_password_confirm ?? ''} onChange={(e) => set({ new_password_confirm: e.target.value })} className={INPUT_CLASS} placeholder="Re-enter new password" minLength={8} />
                </div>
            </div>
        </div>
    );
}

function PathwaySelector({ courses, selectedIds, onChange }: { courses: Course[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
    const toggle = (id: string, checked: boolean) =>
        onChange(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id));

    return (
        <div className="pt-4 border-t-2 border-gray-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-fundi-black">
                <GraduationCap className="h-5 w-5" /> Select Pathways
            </h3>
            <div className="border-2 border-fundi-orange rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-white">
                {courses.length === 0 ? (
                    <p className="text-sm text-gray-500">No pathways available.</p>
                ) : (
                    courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <input
                                type="checkbox"
                                id={`pathway-${course.id}`}
                                checked={selectedIds.includes(course.id)}
                                onChange={(e) => toggle(course.id, e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 accent-fundi-orange"
                            />
                            <label htmlFor={`pathway-${course.id}`} className="text-sm cursor-pointer select-none flex-1 font-medium text-gray-700">
                                {course.name}
                                {course.description && (
                                    <span className="block text-xs text-gray-500 font-normal mt-0.5">{course.description}</span>
                                )}
                            </label>
                        </div>
                    ))
                )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Select the learning pathways you would like to enroll your child in.</p>
        </div>
    );
}
