import { Button } from "@/components/ui/button";

export default function StaffMenu({ onCreateStaff }) {
    return (
        <div className="p-1">
            <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={onCreateStaff}
            >
                Lägg till personal
            </Button>
        </div>
    );
}