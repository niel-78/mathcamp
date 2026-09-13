import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import TabPanelSection from "@/components/layouts/TabPanelSection";

export default function CentralContentFilter({
    contentFilter = {},
    onFilterChange,
    centralContentId,
    onCentralContentChange
}) {

    const [subjects, setSubjects] =
        useState([]);

    const [subjectId, setSubjectId] =
        useState(contentFilter.subjectId || "");

    const [levelId, setLevelId] =
        useState(contentFilter.levelId || "");

    const [areaId, setAreaId] =
        useState(contentFilter.areaId || "");

    const [currentCentralContentId, setCurrentCentralContentId] =
        useState(contentFilter.centralContentId || centralContentId || "");

    useEffect(() => {
        if (contentFilter.subjectId !== undefined) setSubjectId(contentFilter.subjectId || "");
        if (contentFilter.levelId !== undefined) setLevelId(contentFilter.levelId || "");
        if (contentFilter.areaId !== undefined) setAreaId(contentFilter.areaId || "");
        if (contentFilter.centralContentId !== undefined) setCurrentCentralContentId(contentFilter.centralContentId || "");
    }, [contentFilter.subjectId, contentFilter.levelId, contentFilter.areaId, contentFilter.centralContentId]);

    useEffect(() => {
        if (centralContentId !== undefined && centralContentId !== currentCentralContentId) {
            setCurrentCentralContentId(centralContentId || "");
        }
    }, [centralContentId]);

    const notifyChange = (newSubjectId, newLevelId, newAreaId, newCentralContentId) => {
        onFilterChange?.({
            subjectId: newSubjectId,
            levelId: newLevelId,
            areaId: newAreaId,
            centralContentId: newCentralContentId
        });
        onCentralContentChange?.(newCentralContentId);
    };

    useEffect(() => {

        loadSubjects();

    }, []);


    const loadSubjects = async () => {

        const response =
            await fetch(
                `${API_URL}/api/subjects`,
                {
                    headers:
                        authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setSubjects(data);

    };

    const selectedSubject =
        subjects.find(
            subject =>
                subject.id ===
                Number(subjectId)
        );

    const selectedLevel =
        selectedSubject?.levels?.find(
            level =>
                level.id ===
                Number(levelId)
        );

    const selectedArea =
        selectedLevel?.areas?.find(
            area =>
                area.id === Number(areaId)
        );

    const levels =
        subjectId
            ? selectedSubject?.levels || []
            : subjects.flatMap(s => s.levels || []);

    const areas =
        levelId
            ? selectedLevel?.areas || []
            : levels.flatMap(l => l.areas || []);

    const centralContents =
        areaId
            ? (selectedArea?.centralContent || selectedArea?.central_content || [])
            : areas.flatMap(a => a.centralContent || a.central_content || []);

    return (

        <TabPanelSection
            title="Filtrera på centralt innehåll"
            description="
                Hitta block utifrån
                ämne, kurs,
                område och
                centralt innehåll.
            "
        >

            <select
                className="input-standard"
                value={subjectId}
                onChange={(e) => {
                    const newSubjectId = e.target.value;
                    setSubjectId(newSubjectId);
                    setLevelId("");
                    setAreaId("");
                    setCurrentCentralContentId("");
                    notifyChange(newSubjectId, "", "", "");
                }}
            >

                <option value="">
                    Alla ämnen
                </option>

                {subjects.map(
                    subject => (

                        <option
                            key={subject.id}
                            value={subject.id}
                        >
                            {subject.name}
                        </option>

                    )
                )}

            </select>

            <select
                className="input-standard"
                value={levelId}
                onChange={(e) => {
                    const newLevelId = e.target.value;
                    setLevelId(newLevelId);
                    setAreaId("");
                    setCurrentCentralContentId("");
                    notifyChange(subjectId, newLevelId, "", "");
                }}
            >

                <option value="">
                    Alla kurser
                </option>

                {levels.map(
                    level => (

                        <option
                            key={level.id}
                            value={level.id}
                        >
                            {level.name}
                        </option>

                    )
                )}

            </select>

            <select
                className="input-standard"
                value={areaId}
                onChange={(e) => {
                    const newAreaId = e.target.value;
                    setAreaId(newAreaId);
                    setCurrentCentralContentId("");
                    notifyChange(subjectId, levelId, newAreaId, "");
                }}
            >

                <option value="">
                    Alla områden
                </option>

                {areas.map(
                    area => (

                        <option
                            key={area.id}
                            value={area.id}
                        >
                            {area.title}
                        </option>

                    )
                )}

            </select>

            <select
                className="input-standard"
                value={currentCentralContentId}
                onChange={(e) => {
                    const newCCId = e.target.value;
                    setCurrentCentralContentId(newCCId);
                    notifyChange(subjectId, levelId, areaId, newCCId);
                }}
            >

                <option value="">
                    Allt centralt innehåll
                </option>

                {centralContents.map(
                    cc => (

                        <option
                            key={cc.id}
                            value={cc.id}
                        >
                            {cc.content}
                        </option>

                    )
                )}

            </select>

        </TabPanelSection>      
    );

}