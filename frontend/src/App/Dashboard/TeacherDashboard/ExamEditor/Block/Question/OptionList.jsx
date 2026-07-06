import { authHeaders } from "../../../../../../api/authHeaders";
import { API_URL } from "../../../../../../config";
import { formatValue } from "../../../../../../utils/formatValue";
import { formatQuestion } from "../../../../../../utils/formatQuestion";
import { isMathExpression } from "../../../../../../utils/isMathExpression";

export default function OptionList({ options, onChanged, editMode }) {

    const deleteOption = async (optionId) => {

        if (!window.confirm("Ta bort alternativet?")) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/options/${optionId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            }
        );

        onChanged();
    };

    const updateOption = async (
            optionId,
            text,
            is_correct
        ) => {

            await fetch(
                `${API_URL}/api/teacher/exams/options/${optionId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: localStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        text,
                        is_correct
                    })
                }
            );

            onChanged();
        };

    return (
        <ul>
            {options.map(option => (
                <li key={option.id}>
                    
                    <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={() =>
                            updateOption(
                                option.id,
                                option.text,
                                !option.is_correct
                            )
                        }
                    />
                    {
                        editMode ? (
                            <input
                                value={option.text}
                                onChange={(e) =>
                                    updateOptionText(
                                        option.id,
                                        e.target.value,
                                        option.is_correct
                                    )
                                }
                            />
                        ) : (
                            option.text
                        )
                    }
                </li>
            ))}
        </ul>
    );
}
