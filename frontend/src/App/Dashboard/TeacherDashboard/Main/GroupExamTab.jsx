import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import BlockLibrary from "@/components/ui/BlockLibrary";

export default function GroupExamTab({
    groupExamId,
    openTab
}) {

    const [groupExam, setGroupExam] =
        useState(null);

    const [blocks, setBlocks] =
        useState([]);

    useEffect(() => {

        console.log(
            "GroupExamTab",
            groupExamId
        );

        loadGroupExam();
        loadBlocks();

    }, [groupExamId]);


    const loadGroupExam = async () => {

        const response = await fetch(
            `${API_URL}/api/groups/group-exams/${groupExamId}`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setGroupExam(data);

    };

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/groups/group-exams/${groupExamId}/blocks`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setBlocks(data);

    };

    const save = async () => {

        const response = await fetch(
            `${API_URL}/api/groups/group-exams/${groupExamId}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({

                    time_limit_minutes:
                        groupExam.time_limit_minutes
                            ? Number(
                                groupExam.time_limit_minutes
                            )
                            : null,

                    max_attempts:
                        Number(
                            groupExam.max_attempts
                        ),

                    passing_score:
                        groupExam.passing_score
                            ? Number(
                                groupExam.passing_score
                            )
                            : null,

                    shuffle_questions:
                        groupExam.shuffle_questions,

                    shuffle_options:
                        groupExam.shuffle_options,

                    allow_previous:
                        groupExam.allow_previous,

                    allow_same_question:
                        groupExam.allow_same_question,

                    show_calculator:
                        groupExam.show_calculator,

                    show_formula_sheet:
                        groupExam.show_formula_sheet,

                    show_result_immediately:
                        groupExam.show_result_immediately,

                    is_open:
                        groupExam.is_open,

                    available_from:
                        groupExam.available_from || null,

                    available_until:
                        groupExam.available_until || null

                })
            }
        );

        if (!response.ok) {

            console.error(
                await response.text()
            );

            return;

        }

        await loadGroupExam();

    };

    if (!groupExam) {

        return <p>Laddar...</p>;

    }

    return (

        <div className="space-y-8">

            <div>

                <h1 className="text-2xl font-bold">
                    {groupExam.exam_title}
                </h1>

                <p className="text-muted-foreground">
                    Grupp: {groupExam.group_name}
                </p>

            </div>

            <div className="grid gap-8 lg:grid-cols-2">

                <div className="space-y-4">

                    <h2 className="text-xl font-semibold">
                        Inställningar
                    </h2>

                    <div>

                        <label>
                            Nyckel
                        </label>

                        <Input
                            readOnly
                            value={
                                groupExam.group_exam_key || ""
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Tidsgräns (minuter)
                        </label>

                        <Input
                            type="number"
                            value={
                                groupExam.time_limit_minutes ?? ""
                            }
                            onChange={(e) =>
                                setGroupExam({
                                    ...groupExam,
                                    time_limit_minutes:
                                        e.target.value
                                })
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Max försök
                        </label>

                        <Input
                            type="number"
                            value={
                                groupExam.max_attempts ?? ""
                            }
                            onChange={(e) =>
                                setGroupExam({
                                    ...groupExam,
                                    max_attempts:
                                        e.target.value
                                })
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Godkändgräns
                        </label>

                        <Input
                            type="number"
                            value={
                                groupExam.passing_score ?? ""
                            }
                            onChange={(e) =>
                                setGroupExam({
                                    ...groupExam,
                                    passing_score:
                                        e.target.value
                                })
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Tillgänglig från
                        </label>

                        <Input
                            type="datetime-local"
                            value={
                                groupExam.available_from
                                    ?.slice(0, 16) || ""
                            }
                            onChange={(e) =>
                                setGroupExam({
                                    ...groupExam,
                                    available_from:
                                        e.target.value
                                })
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Tillgänglig till
                        </label>

                        <Input
                            type="datetime-local"
                            value={
                                groupExam.available_until
                                    ?.slice(0, 16) || ""
                            }
                            onChange={(e) =>
                                setGroupExam({
                                    ...groupExam,
                                    available_until:
                                        e.target.value
                                })
                            }
                        />

                    </div>

                    <div className="space-y-2">

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={!!groupExam.is_open}
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        is_open:
                                            e.target.checked
                                    })
                                }
                            />

                            Öppet

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.shuffle_questions
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        shuffle_questions:
                                            e.target.checked
                                    })
                                }
                            />

                            Slumpa frågor

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.shuffle_options
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        shuffle_options:
                                            e.target.checked
                                    })
                                }
                            />

                            Slumpa alternativ

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.allow_previous
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        allow_previous:
                                            e.target.checked
                                    })
                                }
                            />

                            Tillåt föregående fråga

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.allow_same_question
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        allow_same_question:
                                            e.target.checked
                                    })
                                }
                            />

                            Tillåt samma fråga flera gånger

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.show_calculator
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        show_calculator:
                                            e.target.checked
                                    })
                                }
                            />

                            Visa miniräknare

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.show_formula_sheet
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        show_formula_sheet:
                                            e.target.checked
                                    })
                                }
                            />

                            Visa formelblad

                        </label>

                        <label className="flex gap-2">

                            <input
                                type="checkbox"
                                checked={
                                    !!groupExam.show_result_immediately
                                }
                                onChange={(e) =>
                                    setGroupExam({
                                        ...groupExam,
                                        show_result_immediately:
                                            e.target.checked
                                    })
                                }
                            />

                            Visa resultat direkt

                        </label>

                    </div>

                    <Button onClick={save}>
                        Spara
                    </Button>

                </div>

                <div>

                    <h2 className="text-xl font-semibold mb-4">
                        Förhandsgranskning
                    </h2>

                    <BlockLibrary
                        blocks={blocks}
                        openTab={openTab}
                    />

                </div>

            </div>

        </div>

    );

}