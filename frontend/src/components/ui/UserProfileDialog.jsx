import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import CardSection from "@/components/layouts/CardSection";

import { useAuth } from "@/contexts/AuthContext";

import { API_URL, APP_VERSION } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { toast } from "sonner";

export default function UserProfileDialog({
    open,
    onOpenChange
}) {

    const {
        user,
        setUser,
        logout
    } = useAuth();

    const [sessions, setSessions] = useState([]);
    const [backendVersion, setBackendVersion] = useState(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    // NYTT: State för e-post
    const [email, setEmail] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);
        
    useEffect(() => {

        if (!open || !user) {
            return;
        }

        // Sätt e-post från användaren när dialogen öppnas
        setEmail(user.email || "");

        fetch(
            `${API_URL}/api/auth/sessions`,
            {
                headers: authHeaders()
            }
        )
            .then(res => res.json())
            .then(setSessions);

        fetch(`${API_URL}/api/public/version`, { cache: "no-store" })
            .then(response => response.ok ? response.json() : null)
            .then(data => setBackendVersion(data?.version || null))
            .catch(() => setBackendVersion(null));

    }, [open, user]);

    if (!user) {
        return null;
    }

    const changeEmail = async () => {

        if (!email) {
            toast.error("Ange en e-postadress");
            return;
        }

        setSavingEmail(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/users/change-email`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            email
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                toast.error(
                    data.error ||
                    "Kunde inte uppdatera e-post"
                );

                return;

            }

            // Uppdatera användaren i AuthContext
            setUser({
                ...user,
                email: email
            });

            toast.success(
                "E-postadressen har uppdaterats"
            );

        } finally {

            setSavingEmail(false);

        }

    };

    const changePassword = async () => {

        if (!currentPassword) {

            toast.error(
                "Ange nuvarande lösenord"
            );

            return;

        }

        if (newPassword.length < 8) {

            toast.error(
                "Lösenordet måste vara minst 8 tecken"
            );

            return;

        }

        if (newPassword !== confirmPassword) {

            toast.error(
                "Lösenorden matchar inte"
            );

            return;

        }

        setSavingPassword(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/users/change-password`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                toast.error(
                    data.error ||
                    "Kunde inte byta lösenord"
                );

                return;

            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            toast.success(
                "Lösenordet har uppdaterats"
            );

        } finally {

            setSavingPassword(false);

        }

    };

    return (

        <Dialog
            open={open}
            onOpenChange={
                onOpenChange
            }
        >

            <DialogContent className="max-h-[90vh] overflow-y-auto">

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

                        <strong>E-post:</strong>
                        {" "}
                        {user.email || "Ingen e-postadress tillgänglig"}

                    </div>

                    {user.school && (

                        <CardSection title="Skola">

                            <div>
                                <strong>Skola:</strong>
                                {" "}
                                {user.school.name}
                            </div>

                            <div>
                                <strong>Behörighet:</strong>
                                {" "}
                                {user.school.is_admin
                                    ? "Lärare och admin"
                                    : "Lärare"}
                            </div>

                        </CardSection>

                    )}

                </div>

                {/* NYTT: Sektion för att hantera e-post */}
                <CardSection title="E-postadress">

                    <div className="space-y-3">

                        <Input
                            type="email"
                            placeholder="Din e-postadress"
                            value={email}
                            onChange={e =>
                                setEmail(
                                    e.target.value
                                )
                            }
                        />

                        <Button
                            className="w-full"
                            onClick={changeEmail}
                            disabled={savingEmail}
                        >

                            {savingEmail
                                ? "Sparar..."
                                : "Uppdatera e-post"}

                        </Button>

                    </div>

                </CardSection>

                <CardSection title="Byt lösenord">

                    <div className="space-y-3">

                        <Input
                            type="password"
                            placeholder="Nuvarande lösenord"
                            value={currentPassword}
                            onChange={e =>
                                setCurrentPassword(
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            type="password"
                            placeholder="Nytt lösenord"
                            value={newPassword}
                            onChange={e =>
                                setNewPassword(
                                    e.target.value
                                )
                            }
                        />

                        <Input
                            type="password"
                            placeholder="Bekräfta nytt lösenord"
                            value={confirmPassword}
                            onChange={e =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                        />

                        <Button
                            className="w-full"
                            onClick={changePassword}
                            disabled={savingPassword}
                        >

                            {savingPassword
                                ? "Sparar..."
                                : "Byt lösenord"}

                        </Button>

                    </div>

                </CardSection>

                <div className="border-t pt-4">

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={logout}
                    >

                        Logga ut

                    </Button>

                </div>

                <div className="text-center font-mono text-xs text-muted-foreground">
                    Webb {APP_VERSION} · API {backendVersion || "okänd"}
                </div>

            </DialogContent>

        </Dialog>

    );

}