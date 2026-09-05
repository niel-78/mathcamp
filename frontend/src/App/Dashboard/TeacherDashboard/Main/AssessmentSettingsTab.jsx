import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const diagnosticDefaults = {
    attempt: {
        defaultTimeLimitMinutes: 60,
        countdownMode: "visible_lock"
    },
    question_selection: {
        shuffleQuestions: true,
        shuffleOptions: true,
        useDifferentQuestionsInBlock: true
    },
    monitoring: {},
    navigation: {
        allowGoToPreviousQuestion: false
    }
};

const assessmentSettingTabs = [
    {
        type: "diagnostic",
        label: "Diagnos",
        defaults: diagnosticDefaults,
        normalize: normalizeDiagnosticConfig
    }
];

function normalizeDiagnosticConfig(config = {}) {

    const timeLimit =
        config.attempt?.defaultTimeLimitMinutes;

    const countdownMode =
        config.attempt?.countdownMode;

    return {
        attempt: {
            defaultTimeLimitMinutes:
                timeLimit === undefined
                    ? diagnosticDefaults
                        .attempt
                        .defaultTimeLimitMinutes
                    : timeLimit,
            countdownMode:
                countdownMode ||
                diagnosticDefaults
                    .attempt
                    .countdownMode
        },
        question_selection: {
            shuffleQuestions: true,
            shuffleOptions: true,
            useDifferentQuestionsInBlock: true
        },
        monitoring: {
            lock_page_refresh:
                !!config.monitoring?.lock_page_refresh,
            lock_tab_hidden:
                !!config.monitoring?.lock_tab_hidden,
            lock_window_blur:
                !!config.monitoring?.lock_window_blur,
            lock_context_menu:
                !!config.monitoring?.lock_context_menu,
            lock_page_unload:
                !!config.monitoring?.lock_page_unload
        },
        navigation: {
            allowGoToPreviousQuestion: false
        }
    };

}

function Field({
    label,
    children
}) {

    return (
        <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
                {label}
            </span>
            {children}
        </label>
    );

}

export default function AssessmentSettingsTab({
    initialAssessmentType = "diagnostic"
}) {

    const [activeAssessmentType, setActiveAssessmentType] =
        useState(initialAssessmentType);

    const activeAssessmentTab =
        assessmentSettingTabs.find(
            tab =>
                tab.type === activeAssessmentType
        ) || assessmentSettingTabs[0];

    const [config, setConfig] =
        useState(activeAssessmentTab.defaults);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {

        loadSettings();

    }, [activeAssessmentType]);

    const loadSettings = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/assessment-type-settings/${activeAssessmentTab.type}`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setConfig(
                activeAssessmentTab.normalize(
                    data.config || {}
                )
            );

        } finally {

            setLoading(false);

        }

    };

    const updateConfig = (
        section,
        key,
        value
    ) => {

        setConfig(previous =>
            activeAssessmentTab.normalize({
                ...previous,
                [section]: {
                    ...previous?.[section],
                    [key]: value
                }
            })
        );

    };

    const save = async () => {

        setSaving(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/assessment-type-settings/${activeAssessmentTab.type}`,
                    {
                        method: "PUT",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            config:
                                activeAssessmentTab.normalize(
                                    config
                                )
                        })
                    }
                );

            if (!response.ok) {
                toast.error(
                    "Kunde inte spara inställningar"
                );
                return;
            }

            toast.success(
                "Inställningarna har sparats"
            );

            await loadSettings();

        } finally {

            setSaving(false);

        }

    };

    if (loading) {
        return (
            <BaseTabLayout title="Assessments">
                <p>Laddar...</p>
            </BaseTabLayout>
        );
    }

    return (
        <BaseTabLayout
            title="Assessments"
            actions={
                <Button
                    onClick={save}
                    disabled={saving}
                >
                    {saving
                        ? "Sparar..."
                        : "Spara"}
                </Button>
            }
        >
            <div className="space-y-6">

                <div
                    className="
                        flex
                        gap-2
                        border-b
                        border-border
                    "
                >
                    {assessmentSettingTabs.map(tab => (
                        <Button
                            key={tab.type}
                            variant={
                                activeAssessmentType === tab.type
                                    ? "default"
                                    : "ghost"
                            }
                            onClick={() =>
                                setActiveAssessmentType(
                                    tab.type
                                )
                            }
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                <CardSection title="Diagnos">

                    <div className="space-y-4">

                        <Field label="Tidsgräns (min)">
                            <Input
                                className="w-32"
                                type="number"
                                min="0"
                                value={
                                    config.attempt?.defaultTimeLimitMinutes ?? ""
                                }
                                onChange={(event) =>
                                    updateConfig(
                                        "attempt",
                                        "defaultTimeLimitMinutes",
                                        event.target.value === ""
                                            ? null
                                            : Number(event.target.value)
                                    )
                                }
                            />
                        </Field>

                        <Field label="Nedräkning">
                            <select
                                className="input-standard w-56"
                                value={
                                    config.attempt?.countdownMode ??
                                    "visible_lock"
                                }
                                onChange={(event) =>
                                    updateConfig(
                                        "attempt",
                                        "countdownMode",
                                        event.target.value
                                    )
                                }
                            >
                                <option value="none">
                                    Utan nedräkning
                                </option>
                                <option value="visible">
                                    Visa nedräkning
                                </option>
                                <option value="visible_lock">
                                    Visa nedräkning och stäng ner
                                </option>
                            </select>
                        </Field>

                    </div>

                </CardSection>

                <CardSection title="Diagnosbeteende">

                    <div className="space-y-4">

                        <Field label="Slumpa frågeordning">
                            <Switch
                                checked
                                disabled
                            />
                        </Field>

                        <Field label="Slumpa alternativordning">
                            <Switch
                                checked
                                disabled
                            />
                        </Field>

                        <Field label="Använd olika uppgifter i block">
                            <Switch
                                checked
                                disabled
                            />
                        </Field>

                        <Field label="Tillåt att gå tillbaka">
                            <Switch
                                checked={false}
                                disabled
                            />
                        </Field>

                    </div>

                </CardSection>

                <CardSection title="Övervakning och låsning">

                    <div className="space-y-4">

                        <Field label="Lås vid siduppdatering">
                            <Switch
                                checked={
                                    !!config.monitoring?.lock_page_refresh
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
                                    !!config.monitoring?.lock_tab_hidden
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
                                    !!config.monitoring?.lock_window_blur
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
                                    !!config.monitoring?.lock_context_menu
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
                                    !!config.monitoring?.lock_page_unload
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

            </div>
        </BaseTabLayout>
    );

}