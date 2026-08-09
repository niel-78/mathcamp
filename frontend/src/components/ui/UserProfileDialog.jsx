import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import CardSection from "@/components/layouts/CardSection";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function UserProfileDialog({
    open,
    onOpenChange
}) {

    const {
        user,
        logout
    } = useAuth();

    if (!user) {
        return null;
    }

    const [sessions, setSessions] = useState([]);

    useEffect(() => {

        if (!open) {
            return;
        }

        fetch(
            `${API_URL}/api/auth/sessions`,
            {
                headers: authHeaders()
            }
        )
            .then(res => res.json())
            .then(setSessions);

    }, [open]);

    return (

        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Min profil
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div>

                        <strong>Namn:</strong>
                        {" "}
                        {user.first_name}
                        {" "}
                        {user.last_name}

                    </div>

                    <div>

                        <strong>Roll:</strong>
                        {" "}
                        {user.role}

                    </div>

                    <CardSection title="Inställningar">

                        <p className="text-muted-foreground">
                            Kommande funktion.
                        </p>

                    </CardSection>

                    <CardSection title="Sessionshistorik">

                        {sessions.map(session => (

                            <div
                                key={session.id}
                                className="
                                    border-b
                                    py-2
                                "
                            >

                                <div>
                                    Inloggad:
                                    {" "}
                                            
                                    {session.logged_in_at}

                                </div>

                                <div>
                                    Utloggad:
                                    {" "}

                                    {session.logged_out_at}

                                </div>

                            </div>

                        ))}

                    </CardSection>

                </div>

                <div className="pt-4 border-t">

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={logout}
                    >
                        Logga ut
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}