import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function BlockFilter({
    subjectId,
    onSubjectChange,

    levelId,
    onLevelChange,

    areaId,
    onAreaChange,

    centralContentId,
    onCentralContentChange
}) {

    const [subjects, setSubjects] =
        useState([]);


    useEffect(() => {

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

            const data =
                await response.json();

            console.log(data);    

            setSubjects(data);

        };

        loadSubjects();

    }, []);


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

        <div
            className="
                flex
                flex-col
                gap-3
                max-w-md
            "
        >

            <select
                className="
                    input-standard
                "
                value={subjectId}
                onChange={(e) => {

                    onSubjectChange(
                        e.target.value
                    );

                    onLevelChange("");
                    onAreaChange("");
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

                    onLevelChange(
                        e.target.value
                    );

                    onAreaChange("");
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

                    onAreaChange(
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


        </div>      
    );


}