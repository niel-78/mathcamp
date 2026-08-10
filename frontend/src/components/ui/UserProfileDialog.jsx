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

    const [sessions, setSessions] =
        useState([]);
    
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

                    
                    {isTeacher && (

                        <>
                        
                            <CardSection title="Aktiv skola">

                                {user.active_school ? (

                                    <div className="space-y-2">

                                        <div>

                                            <strong>Skola:</strong>
                                            {" "}
                                            {user.active_school.name}

                                        </div>

                                        <div>

                                            <strong>Behörighet:</strong>
                                            {" "}
                                            {user.active_school.is_admin
                                                ? "Skoladministratör"
                                                : "Lärare"}

                                        </div>

                                    </div>

                                ) : (

                                    <p className="text-muted-foreground">
                                        Ingen aktiv skola vald.
                                    </p>

                                )}

                            </CardSection>

                            {user.schools.length > 1 && (

                                <CardSection title="Byt skola">

                                    <select
                                        value={user.active_school_id}
                                        onChange={handleSchoolChange}
                                        className="
                                            w-full
                                            rounded-md
                                            border
                                            bg-background
                                            p-2
                                        "
                                    >

                                        {user.schools.map(
                                            school => (

                                                <option
                                                    key={school.id}
                                                    value={school.id}
                                                >

                                                    {school.name}
                                                    {" "}
                                                    (
                                                    {school.is_admin
                                                        ? "Administratör"
                                                        : "Lärare"}
                                                    )

                                                </option>

                                            )
                                        )}

                                    </select>

                                </CardSection>

                            )}

                        </>

                    )}

                    {user.schools?.length > 0 && (

                        <CardSection title="Mina skolor">

                            <div className="space-y-2">

                                {user.schools.map(
                                    school => (

                                        <div
                                            key={school.id}
                                            className="
                                                flex
                                                justify-between
                                                rounded-md
                                                border
                                                p-2
                                            "
                                        >

                                            <span>

                                                {school.name}

                                                {school.id ===
                                                    user.active_school_id &&
                                                    " ✓"}

                                            </span>

                                            <span
                                                className="
                                                    text-sm
                                                    text-muted-foreground
                                                "
                                            >

                                                {
                                                    school.is_admin
                                                        ? "Administratör"
                                                        : "Lärare"
                                                }

                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        </CardSection>

                    )}

                </div>

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