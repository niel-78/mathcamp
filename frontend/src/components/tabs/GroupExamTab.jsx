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
            `${API_URL}/api/group-assessments/${groupExamId}`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        data.config =
            typeof data.config === "string"
                ? JSON.parse(data.config)
                : (data.config || {});

        setGroupExam(data);
        setSavedGroupExam(data);

    };

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/blocks`,
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
            `${API_URL}/api/group-assessments/${groupExamId}/waiting-room`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setWaitingCount(data.length);
    };

    const loadMonitorCount = async () => {

        const response = await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/monitor`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (!Array.isArray(data)) {

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
            `${API_URL}/api/group-assessments/${groupExamId}/admit-all`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        await loadGroupExam();

    };

    const closeExam = async () => {

        await fetch(
            `${API_URL}/api/group-assessments/${groupExamId}/close`,
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
                `${API_URL}/api/group-assessments/${groupExamId}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({

                        max_attempts:
                            Number(
                                groupExam.max_attempts
                            ),

                        waiting_room_open:
                            groupExam.waiting_room_open,

                        available_from:
                            groupExam.available_from || null,

                        available_until:
                            groupExam.available_until || null,

                        config:
                            groupExam.config

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

    const updateConfig = (section, key, value) => {
        setGroupExam((prev) => ({
            ...prev,
            config: {
                ...prev.config,
                [section]: {
                    ...prev.config?.[section],
                    [key]: value,
                },
            },
        }));
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

            title={groupExam.assessment_title}

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
                                        groupExam.group_assessment_key
                                    }

                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() =>
                                        openTab({
                                            id: `waiting-room-${groupExamId}`,
                                            type: "group-assessment-waiting-room",
                                            title:
                                                `${groupExam.assessment_title} · Väntrum`,
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
                                            type: "group-assessment-monitor",
                                            title:
                                                `${groupExam.assessment_title} · Övervakning`,
                                            groupExamId
                                        })
                                    }
                                >
                                    Övervakning ({monitorCount})
                                </Button>
                                <div>

                                    <strong>Status:</strong>{" "}

                                    {savedGroupExam?.assessment_status === "waiting" &&
                                        "Väntar"}

                                    {savedGroupExam?.assessment_status === "open" &&
                                        "Pågående"}

                                    {savedGroupExam?.assessment_status === "closed" &&
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
                                        groupExam.assessment_status === "open"
                                    }
                                >
                                    Släpp in elever
                                </Button>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={closeExam}
                                    disabled={
                                        groupExam.assessment_status === "closed"
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
                                    groupExam.config?.assessment?.defaultTimeLimitMinutes ?? ""
                                }
                                onChange={(e) =>
                                    updateConfig(
                                        "assessment",
                                        "defaultTimeLimitMinutes",
                                        Number(e.target.value)
                                    )
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
                                    !!groupExam.config?.question_selection?.shuffleQuestions
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "question_selection",
                                        "shuffleQuestions",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Slumpa alternativordning">

                            <Switch
                                checked={
                                    !!groupExam.config?.question_selection?.shuffleOptions
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "question_selection",
                                        "shuffleOptions",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Använd olika uppgifter i block">

                            <Switch
                                checked={
                                    !!groupExam.config?.question_selection?.useDifferentQuestionsInBlock
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "question_selection",
                                        "useDifferentQuestionsInBlock",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Upprepa aldrig fråga">

                            <Switch
                                checked={
                                    !!groupExam.config?.question_selection?.neverRepeatQuestion
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "question_selection",
                                        "neverRepeatQuestion",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Tillåt att gå tillbaka">

                            <Switch
                                checked={
                                    !!groupExam.config?.navigation?.allowGoToPreviousQuestion
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "navigation",
                                        "allowGoToPreviousQuestion",
                                        checked
                                    )
                                }
                            />

                        </Field>

                    </div>

                </CardSection>

                <CardSection
                    title="Övervakning och låsning"
                >

                    <div className="space-y-4">

                        <Field label="Lås vid siduppdatering">

                            <Switch
                                checked={
                                    !!groupExam.config?.monitoring?.lock_page_refresh
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "monitoring",
                                        "lock_page_refresh",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Lås vid flikbyte">

                            <Switch
                                checked={
                                    !!groupExam.config?.monitoring?.lock_tab_hidden
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "monitoring",
                                        "lock_tab_hidden",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Lås vid fokusförlust">

                            <Switch
                                checked={
                                    !!groupExam.config?.monitoring?.lock_window_blur
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "monitoring",
                                        "lock_window_blur",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Lås vid högerklick">

                            <Switch
                                checked={
                                    !!groupExam.config?.monitoring?.lock_context_menu
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "monitoring",
                                        "lock_context_menu",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Lås vid sidstängning">

                            <Switch
                                checked={
                                    !!groupExam.config?.monitoring?.lock_page_unload
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "monitoring",
                                        "lock_page_unload",
                                        checked
                                    )
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
                                    groupExam.config?.presentation?.allowCalculator
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "presentation",
                                        "allowCalculator",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Visa formelblad">

                            <Switch
                                checked={
                                    groupExam.config?.presentation?.allowFormulaSheet
                                }
                                onCheckedChange={(checked) =>
                                    updateConfig(
                                        "presentation",
                                        "allowFormulaSheet",
                                        checked
                                    )
                                }
                            />

                        </Field>

                        <Field label="Visa resultat direkt">

                            <Switch
                            checked={
                                !!groupExam.config?.presentation?.showResultImmediately
                            }
                            onCheckedChange={(checked) =>
                                updateConfig(
                                    "presentation",
                                    "showResultImmediately",
                                    checked
                                )
                            }
                            />

                        </Field>

                    </div>

                </CardSection>

            </DetailLayout>

        </BaseTabLayout>

    );

}