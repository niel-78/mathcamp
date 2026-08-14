import { useEffect, useState } from "react";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DetailLayout from "@/components/layouts/DetailLayout";
import CardSection from "@/components/layouts/CardSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function PlanningQueueTab({
    groupId
}) {

    const [sections, setSections] = useState([]);
    const [pagesPerLesson, setPagesPerLesson] = useState(4);

    useEffect(() => {

        loadQueue();

    }, [groupId]);

    const loadQueue = async () => {

        const response =
            await fetch(
                `${API_URL}/api/groups/${groupId}/planning-sections/edit`,
                {
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setPagesPerLesson(
            data.pages_per_lesson
        );

        setSections(
            data.sections
        );

    };

    const save = async () => {

        const sectionIds =
            sections
                .filter(
                    s => s.selected
                )
                .map(
                    s => s.id
                );

        const response =
            await fetch(
                `${API_URL}/api/groups/${groupId}/planning-sections`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        sectionIds,
                        pages_per_lesson: pagesPerLesson
                    })
                }
            );

        if (!response.ok) {

            toast.error(
                "Kunde inte spara planeringskön"
            );

            return;

        }

        toast.success(
            "Planeringskön har sparats"
        );

    };

    const fillPlanning = async () => {

        const response =
            await fetch(
                `${API_URL}/api/groups/${groupId}/fill-planning`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {

            toast.error(
                "Kunde inte fylla planeringen"
            );

            return;

        }

        toast.success(
            "Planeringen har fyllts"
        );

    };

    const allSelected =
        sections.length > 0 &&
        sections.every(
            section => section.selected
        );

    const toggleAll = (checked) => {

        setSections(
            prev =>
                prev.map(
                    section => ({
                        ...section,
                        selected: !!checked
                    })
                )
        );

    };

    return (

        <BaseTabLayout
            title="Planeringskö"
            actions={
                <div className="flex gap-2">

                    <Button
                        variant="outline"
                        onClick={save}
                    >
                        Spara
                    </Button>

                    <Button
                        onClick={fillPlanning}
                    >
                        Fyll planering
                    </Button>

                </div>
            }
        >

            <DetailLayout

                sidebar={

                    <CardSection
                        title="Inställningar"
                    >

                        <div className="space-y-4">

                            <div>

                                <label>
                                    Sidor per lektion
                                </label>

                                <Input
                                    type="number"
                                    min="1"
                                    value={pagesPerLesson}
                                    onChange={(e) =>
                                        setPagesPerLesson(
                                            Number(
                                                e.target.value
                                            )
                                        )
                                    }
                                />

                            </div>

                            <div>

                                <strong>
                                    Valda sektioner
                                </strong>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    {
                                        sections.filter(
                                            s => s.selected
                                        ).length
                                    }
                                    {" av "}
                                    {sections.length}
                                </div>

                            </div>

                        </div>

                    </CardSection>

                }

            >

                <CardSection
                    title="Sektioner"
                >

                    <div className="space-y-2">

                        <label
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={
                                    toggleAll
                                }
                            />

                            {
                                allSelected
                                    ? "Avmarkera alla"
                                    : "Markera alla"
                            }

                        </label>

                        {sections.map(
                            section => (

                                <label
                                    key={section.id}
                                    className="
                                        card
                                        p-3
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >

                                    <Checkbox
                                        checked={
                                            section.selected
                                        }
                                        onCheckedChange={
                                            checked =>
                                                toggleAll(
                                                    section.id,
                                                    checked
                                                )
                                        }
                                    />

                                    <div>

                                        <div
                                            className="
                                                text-sm
                                                text-muted-foreground
                                            "
                                        >

                                            {
                                                section.chapter_number
                                            }
                                            .
                                            {
                                                section.subchapter_number
                                            }

                                        </div>

                                        <div>
                                            {section.title}
                                        </div>

                                    </div>

                                </label>

                            )
                        )}

                    </div>

                </CardSection>

            </DetailLayout>

        </BaseTabLayout>

    );

}