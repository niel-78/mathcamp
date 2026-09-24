import { useEffect, useState } from "react";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

export default function BookPlanningQueueTab({ bookId, bookTitle }) {
    const [sections, setSections] = useState([]);

    useEffect(() => {
        const load = async () => {
            const response = await fetch(
                `${API_URL}/api/books/${bookId}/planning-sections/edit`,
                { headers: authHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setSections(data.sections || []);
            }
        };

        load();
    }, [bookId]);

    const save = async () => {
        const response = await fetch(
            `${API_URL}/api/books/${bookId}/planning-sections`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sections: sections.map(section => ({
                        id: section.id,
                        selected: section.selected,
                        priority: section.priority
                    }))
                })
            }
        );

        if (!response.ok) {
            toast.error("Kunde inte spara bokens planeringskö");
            return;
        }

        toast.success("Bokens planeringskö har sparats");
    };

    const updateSection = (sectionId, changes) => {
        setSections(prev => prev.map(section =>
            section.id === sectionId
                ? { ...section, ...changes }
                : section
        ));
    };

    return (
        <BaseTabLayout
            title={`Planeringskö: ${bookTitle}`}
            actions={
                <Button onClick={save}>Spara</Button>
            }
        >
            <CardSection title="Sektioner">
                <p className="mb-4 text-sm text-muted-foreground">
                    Markera vilka sektioner som ska ingå som standard. Prioriterade sektioner är viktiga områden för elever som siktar på E.
                </p>

                <div className="w-full space-y-2 text-left">
                    {sections.map(section => (
                        <div
                            key={section.id}
                            className="card flex items-center gap-3 p-3"
                        >
                            <Checkbox
                                checked={Boolean(section.selected)}
                                onCheckedChange={checked =>
                                    updateSection(section.id, {
                                        selected: Boolean(checked)
                                    })
                                }
                            />

                            <div className="min-w-0 flex-1">
                                <div className="text-xs text-muted-foreground">
                                    {section.chapter_number}.{section.subchapter_number}
                                </div>
                                <div>{section.title}</div>

                                <label className="mt-2 flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={Boolean(section.priority)}
                                        disabled={!section.selected}
                                        onCheckedChange={checked =>
                                            updateSection(section.id, {
                                                priority: Boolean(checked)
                                            })
                                        }
                                    />
                                    Prioriterad (viktig för E)
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </CardSection>
        </BaseTabLayout>
    );
}
