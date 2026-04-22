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

interface UserBulkImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const UserBulkImportDialog = ({ open, onOpenChange, onSubmit }: UserBulkImportDialogProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Bulk Import Users</DialogTitle>
                <DialogDescription>
                    Upload a CSV file to import multiple users at once
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit}>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="bulk-import-file">CSV File</Label>
                        <Input id="bulk-import-file" type="file" accept=".csv" required />
                        <p className="text-xs text-gray-500 mt-2">
                            CSV format: username,email,first_name,last_name,role,tenant_id,password
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700 font-semibold mb-1">Example CSV:</p>
                        <pre className="text-xs text-blue-600 whitespace-pre-wrap">
                            {`username,email,first_name,last_name,role,password\njohn.doe,john@example.com,John,Doe,teacher,Pass123!`}
                        </pre>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit">Import Users</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
);
