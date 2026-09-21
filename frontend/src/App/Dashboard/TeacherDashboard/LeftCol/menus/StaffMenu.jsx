import { Button } from "@/components/ui/button";

export default function StaffMenu({
    contextMenu,
    onCreateStaff,
    onResetPassword
}) {
    return (
        <div className="context-menu">
            {contextMenu?.staffName && (
                <>
                    <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                        {contextMenu.firstName} {contextMenu.lastName}
                    </div>
                    <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                        {contextMenu.userName}
                    </div>
                    <Button
                        className="context-menu-button"
                        variant="inline"
                        onClick={onResetPassword}
                    >
                        Nytt lösenord
                    </Button>
                </>
            )}

            {!contextMenu?.staffName && (
            <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={onCreateStaff}
            >
                Lägg till personal
            </Button>
            )}
        </div>
    );
}