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

import { API_URL } from "@/config";
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

    const [currentPassword, setCurrentPassword] = useState("");

    const [newPassword, setNewPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");

    const [savingPassword, setSavingPassword] = useState(false);
        
    useEffect(() => {

        if (!open || !user) {
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

    }, [open, user]);

    if (!user) {
        return null;
    }

    const isTeacher = user.schools?.length > 0;

    const handleSchoolChange =
        async (event) => {

            const schoolId =
                Number(
                    event.target.value
                );

            const response =
                await fetch(
                    `${API_URL}/api/users/active-school`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            school_id: schoolId
                        })
                    }
                );

            if (!response.ok) {

                toast.error(
                    "Kunde inte byta skola."
                );

                return;

            }

            const activeSchool =
                user.schools.find(
                    school =>
                        school.id ===
                        schoolId
                );

            setUser({

                ...user,

                active_school_id:
                    schoolId,

                active_school:
                    activeSchool

            });

            toast.success(
                "Aktiv skola uppdaterad."
            );

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

            </DialogContent>

        </Dialog>

    );

}