import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";


export default function GroupExamCard({ groupExam, onChanged }) {

    const update = async (
        field,
        value
    ) => {

        await fetch(
            `${API_URL}/api/teacher/group-exams/${groupExam.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                        ...authHeaders()
                },
                body: JSON.stringify({
                    ...groupExam,
                    value
                })
            }
        );

        onChanged();
    };

    return (
        <div>

            <h4>
                {groupExam.title}
            </h4>

            <label>
                Tidsgräns
            </label>

            <input
                type="number"
                defaultValue={
                    groupExam.time_limit_minutes
                        || ""
                }
                onBlur={(e) =>
                    update(
                        "time_limit_minutes",
                        e.target.value
                    )
                }
            />

            <label>
                Max försök
            </label>

            <input
                type="number"
                defaultValue={groupExam.max_attempts}
                onBlur={(e) =>
                    update(
                        "max_attempts",
                        e.target.value
                    )
                }
            />

            <label>
                <input
                    type="checkbox"
                    checked={
                        groupExam.shuffle_questions
                    }
                    onChange={(e) =>
                        update(
                            "shuffle_questions",
                            e.target.checked
                        )
                    }
                />
                Blanda frågor
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={
                        groupExam.shuffle_options
                    }
                    onChange={(e) =>
                        update(
                            "shuffle_options",
                            e.target.checked
                        )
                    }
                />
                Blanda alternativ
            </label>
        </div>
    );
}