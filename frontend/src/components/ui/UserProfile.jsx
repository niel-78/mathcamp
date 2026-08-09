import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import UserProfileDialog
    from "@/components/ui/UserProfileDialog";

export default function UserProfile() {

    const { user } = useAuth();

    const [open, setOpen] =
        useState(false);

    if (!user) {
        return null;
    }

    return (

        <>

            <div
                className="
                    border-b
                    p-4
                    cursor-pointer
                "
                onClick={() =>
                    setOpen(true)
                }
            >

                <div className="flex items-center gap-3">

                    <div
                        className="
                            w-10 h-10
                            rounded-full
                            bg-slate-300
                            flex
                            items-center
                            justify-center
                            font-semibold
                        "
                    >
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                    </div>

                    <div>

                        <div className="font-semibold">
                            {user.first_name}
                            {" "}
                            {user.last_name}
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {user.role}
                        </div>

                    </div>

                </div>

            </div>

            <UserProfileDialog
                open={open}
                onOpenChange={setOpen}
            />

        </>

    );

}