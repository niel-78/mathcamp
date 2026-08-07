import { Button } from "@/components/ui/button";

import CreateGroupExam from "@/components/ui/CreateGroupExamDialog";

export default function GroupExamLibrary({
    groupExams,
    openTab,
    onReload
}) {

    return (

        <div className="space-y-6">

            {!groupExams?.length && (

                <p>
                    Inga provtillfällen.
                </p>

            )}

            <div className="grid gap-4">

                {groupExams?.map(
                    groupExam => (

                        <div
                            key={groupExam.id}
                            className="
                                border
                                rounded
                                p-4
                            "
                        >

                            <h3 className="font-bold">
                                {
                                    groupExam.exam_title
                                }
                            </h3>

                            <p>
                                Grupp:
                                {" "}
                                {
                                    groupExam.group_name
                                }
                            </p>

                            <Button
                                className="mt-3"
                                onClick={() =>
                                    openTab({
                                        id: `group-exam-${groupExam.id}`,
                                        title:
                                            `${groupExam.exam_title} (${groupExam.group_name})`,
                                        type: "group-exam",
                                        groupExamId:
                                            groupExam.id
                                    })
                                }
                            >
                                Öppna
                            </Button>

                        </div>

                    )

                )}

            </div>

        </div>

    );

}