import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import DetailLayout from "@/components/layouts/DetailLayout";
import CardSection from "@/components/layouts/CardSection";
import ExamPreview from "@/components/ui/ExamPreview";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function GroupExamTab({
    groupExamId,
    openTab
}) {

    const [groupExam, setGroupExam] =
        useState(null);

    const [savedGroupExam, setSavedGroupExam] =
        useState(null);

    const [blocks, setBlocks] =
        useState([]);

    const [saving, setSaving] =
        useState(false);

    const [waitingCount, setWaitingCount] =
        useState(0);

    const [monitorCount, setMonitorCount] =
        useState(0);

    useEffect(() => {

        loadGroupExam();
        loadBlocks();
        loadWaitingRoomCount();
        loadMonitorCount();

        const interval = setInterval(() => {

            loadWaitingRoomCount();
            loadMonitorCount();

        }, 3000);

        return () => clearInterval(interval);

    }, [groupExamId]);

    const loadGroupExam = async () => {

        const response = await fetch(
            `${API_URL}/api/group-exams/${groupExamId}`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        console.log("LOADED", data.exam_status);

        setGroupExam(data);
        setSavedGroupExam(data);

    };

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/group-exams/${groupExamId}/blocks`,
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

    const loadWaitingRoomCount = async () => {

        const response = await fetch(
            `${API_URL}/api/group-exams/${groupExamId}/waiting-room`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        console.log(data);

        setWaitingCount(data.length);
    };

    const loadMonitorCount = async () => {

        const response = await fetch(
            `${API_URL}/api/group-exams/${groupExamId}/monitor`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        console.log("MONITOR DATA", data);

        if (!Array.isArray(data)) {

            console.error(
                "Expected array but got:",
                data
            );

            setMonitorCount(0);

            return;
        }

        const count = data.filter(
            student =>
                student.status === "in_progress"
        ).length;

        setMonitorCount(count);

    };


    const openExam = async () => {

        await fetch(
            `${API_URL}/api/group-exams/${groupExamId}/open`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        await loadGroupExam();
    };

    const closeExam = async () => {

        await fetch(
            `${API_URL}/api/group-exams/${groupExamId}/close`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        await loadGroupExam();
    };

    const save = async () => {

        setSaving(true);

        try {

            const response = await fetch(
                `${API_URL}/api/group-exams/${groupExamId}`,
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

                        waiting_room_open:
                            groupExam.waiting_room_open,    

                        shuffle_order_questions:
                            groupExam.shuffle_order_questions,

                        shuffle_order_options:
                            groupExam.shuffle_order_options,

                        use_different_questions_in_block:
                            groupExam.use_different_questions_in_block,

                        allow_go_to_previous_question:
                            groupExam.allow_go_to_previous_question,

                        never_repeat_question:
                            groupExam.never_repeat_question,

                        show_calculator:
                            groupExam.show_calculator,

                        show_formula_sheet:
                            groupExam.show_formula_sheet,

                        show_result_immediately:
                            groupExam.show_result_immediately,

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

                toast.error(
                    "Kunde inte spara provtillfället"
                );

                return;

            }

            await loadGroupExam();

            toast.success(
                "Provtillfället har sparats"
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Kunde inte spara provtillfället"
            );

        } finally {

            setSaving(false);

        }

    };

    function Field({
        label,
        children
    }) {

        return (

            <div
                className="
                    grid
                    grid-cols-[180px_1fr]
                    items-center
                    gap-4
                "
            >

                <div
                    className="
                        text-sm
                        font-medium
                    "
                >
                    {label}
                </div>

                {children}

            </div>

        );

    }

    if (!groupExam) {

        return <p>Laddar...</p>;

    }

    return (

        <BaseTabLayout

            title={groupExam.exam_title}

            actions={

                <Button
                    disabled={saving}
                    onClick={save}
                >
                    {
                        saving
                            ? "Sparar..."
                            : "Spara"
                    }
                </Button>

            }

        >

            <DetailLayout

                sidebar={
                    <>
                        <CardSection
                            title="Information"
                        >

                            <div className="space-y-3">

                                <div>

                                    <strong>Grupp:</strong>
                                    {" "}
                                    {groupExam.group_name}

                                </div>

                                <div>

                                    <strong>Nyckel:</strong>
                                    {" "}
                                    {
                                        groupExam.group_exam_key
                                    }

                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() =>
                                        openTab({
                                            id: `waiting-room-${groupExamId}`,
                                            type: "group-exam-waiting-room",
                                            title:
                                                `${groupExam.exam_title} · Väntrum`,
                                            groupExamId
                                        })
                                    }
                                >
                                    Väntrum ({waitingCount})
                                </Button>
                                <Button
                                    className="w-full"
                                    onClick={() =>
                                        openTab({
                                            id: `monitor-${groupExamId}`,
                                            type: "group-exam-monitor",
                                            title:
                                                `${groupExam.exam_title} · Övervakning`,
                                            groupExamId
                                        })
                                    }
                                >
                                    Övervakning ({monitorCount})
                                </Button>
                                <div>

                                    <strong>Status:</strong>{" "}

                                    {savedGroupExam?.exam_status === "waiting" &&
                                        "Väntar"}

                                    {savedGroupExam?.exam_status === "open" &&
                                        "Pågående"}

                                    {savedGroupExam?.exam_status === "closed" &&
                                        "Stängt"}

                                </div>

                                <div>

                                    <strong>Väntrum:</strong>{" "}

                                    {savedGroupExam?.waiting_room_open
                                        ? "Öppet"
                                        : "Stängt"}

                                </div>

                            </div>

                        </CardSection>

                        <CardSection title="Provstatus">

                            <div className="space-y-2">

                                <Button
                                    className="w-full"
                                    onClick={openExam}
                                    disabled={
                                        groupExam.exam_status === "open"
                                    }
                                >
                                    Släpp in elever
                                </Button>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={closeExam}
                                    disabled={
                                        groupExam.exam_status === "closed"
                                    }
                                >
                                    Stäng dörren för nya insläpp
                                </Button>

                            </div>

                        </CardSection>

                        <CardSection
                            title="Förhandsgranskning"
                        >

                            <ExamPreview
                                groupExamId={
                                    groupExamId
                                }
                            />

                        </CardSection>
                </>
                }

            >

                <CardSection
                    title="Grundinställningar"
                >

                    <div className="space-y-4">

                        <Field label="Tidsgräns (min)">
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
                        </Field>

                        <Field label="Max försök">
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
                        </Field>

                    </div>

                </CardSection>

                <CardSection
                    title="Tillgänglighet"
                >

                    <Field label="Väntrum öppet">

                        <Switch
                            checked={
                                !!groupExam.waiting_room_open
                            }
                            onCheckedChange={(checked) =>
                                setGroupExam({
                                    ...groupExam,
                                    waiting_room_open: checked
                                })
                            }
                        />

                    </Field>

                    <div className="space-y-4">

                        <Field label="Tillgänglig från">
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
                        </Field>

                        <Field label="Tillgänglig till">
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
                        </Field>

                    </div>

                </CardSection>

                <CardSection
                    title="Genomförande"
                >

                    <div className="space-y-4">

                        <Field label="Slumpa frågeordning">

                            <Switch
                                checked={
                                    !!groupExam.shuffle_order_questions
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        shuffle_order_questions:
                                            checked
                                    })
                                }
                            />

                        </Field>

                        <Field label="Slumpa alternativordning">

                            <Switch
                                checked={
                                    !!groupExam.shuffle_order_options
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        shuffle_order_options:
                                            checked
                                    })
                                }
                            />

                        </Field>

                        <Field label="Använd olika uppgifter i block">

                            <Switch
                                checked={
                                    !!groupExam.use_different_questions_in_block
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        use_different_questions_in_block:
                                            checked
                                    })
                                }
                            />

                        </Field>

                        <Field label="Tillåt att gå tillbaka">

                            <Switch
                                checked={
                                    !!groupExam.allow_go_to_previous_question
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        allow_go_to_previous_question:
                                            checked
                                    })
                                }
                            />

                        </Field>

                        <Field label="Upprepa aldrig fråga">

                            <Switch
                                checked={
                                    !!groupExam.never_repeat_question
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        never_repeat_question:
                                            checked
                                    })
                                }
                            />

                        </Field>

                    </div>

                </CardSection>

                <CardSection
                    title="Hjälpmedel"
                >

                    <div className="space-y-4">

                        <Field label="Visa miniräknare">

                            <Switch
                                checked={
                                    !!groupExam.show_calculator
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        show_calculator:
                                            checked
                                    })
                                }
                            />

                        </Field>

                        <Field label="Visa formelblad">

                            <Switch
                                checked={
                                    !!groupExam.show_formula_sheet
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        show_formula_sheet:
                                            checked
                                    })
                                }
                            />

                        </Field>

                        <Field label="Visa resultat direkt">

                            <Switch
                                checked={
                                    !!groupExam.show_result_immediately
                                }
                                onCheckedChange={(checked) =>
                                    setGroupExam({
                                        ...groupExam,
                                        show_result_immediately:
                                            checked
                                    })
                                }
                            />

                        </Field>

                    </div>

                </CardSection>

            </DetailLayout>

        </BaseTabLayout>

    );

}