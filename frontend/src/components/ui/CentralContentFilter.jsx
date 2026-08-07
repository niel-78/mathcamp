import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import TabPanelSection from "@/components/layouts/TabPanelSection";


export default function CentralContentFilter({
    centralContentId,
    onCentralContentChange
}) {

    const [subjects, setSubjects] =
        useState([]);

    const [subjectId, setSubjectId] =
        useState("");

    const [levelId, setLevelId] =
        useState("");

    const [areaId, setAreaId] =
        useState("");



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
        console.log(subjects[0]);

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
                className="
                    input-standard
                "
                value={subjectId}
                onChange={(e) => {

                    setSubjectId(
                        e.target.value
                    );

                    setLevelId("");
                    setAreaId("");
                    onCentralContentChange("");

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
                className="
                    input-standard
                "
                value={levelId}
                onChange={(e) => {

                    setLevelId(
                        e.target.value
                    );

                    setAreaId("");
                    onCentralContentChange("");

                }}
            >

                <option value="">
                    Alla kurser
                </option>

                {selectedSubject?.levels?.map(
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

                    setAreaId(
                        e.target.value
                    );

                    onCentralContentChange("");

                }}
            >

                <option value="">
                    Alla områden
                </option>

                {selectedLevel?.areas?.map(
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
                value={centralContentId}
                onChange={(e) =>
                    onCentralContentChange(
                        e.target.value
                    )
                }
            >

                <option value="">
                    Allt centralt innehåll
                </option>

                {selectedArea?.centralContent?.map(
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