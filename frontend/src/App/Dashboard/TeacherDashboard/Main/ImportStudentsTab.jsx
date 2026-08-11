import { useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { TabSection } from "@/components/layouts/TabSection";
import { Button } from "@/components/ui/button";

export default function ImportStudentsTab({
    groupId,
    groupName
}) {

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const importStudents = async () => {

        if (!file) {
            return;
        }

        setLoading(true);

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        const response = await fetch(
            `${API_URL}/api/groups/${groupId}/import-students`,
            {
                method: "POST",
                headers: authHeaders(),
                body: formData
            }
        );

        const data =
            await response.json();

        setResult(data);

        setLoading(false);

    };

    return (

        <BaseTabLayout

            title={`Importera elever - ${groupName}`}

            actions={
                <Button
                    disabled={!file || loading}
                    onClick={importStudents}
                >
                    {
                        loading
                            ? "Importerar..."
                            : "Importera"
                    }
                </Button>
            }

        >

            <TabSection
                title="Excel-fil"
            >

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                        setFile(
                            e.target.files?.[0]
                        )
                    }
                />

                <p className="mt-2 text-sm text-muted-foreground">
                    Filen ska innehålla kolumnerna
                    Förnamn och Efternamn.
                </p>

            </TabSection>

            {result && (

                <TabSection
                    title="Resultat"
                >

                    <p>
                        Importerade elever:
                        {" "}
                        {result.importedCount}
                    </p>

                    <div className="mt-4 space-y-2">

                        {result.students?.map(
                            student => (

                                <div
                                    key={student.id}
                                    className="
                                        p-3
                                        border
                                        rounded-md
                                    "
                                >
                                    <div>
                                        <strong>
                                            {student.firstName}
                                            {" "}
                                            {student.lastName}
                                        </strong>
                                    </div>

                                    <div>
                                        Användarnamn:
                                        {" "}
                                        {student.username}
                                    </div>

                                    <div>
                                        Lösenord:
                                        {" "}
                                        {student.password}
                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </TabSection>

            )}

        </BaseTabLayout>

    );

}