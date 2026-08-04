import { useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import MathContent from "@/components/ui/MathContent";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DeleteOptionDialog from "@/components/ui/DeleteOptionDialog";

export default function OptionList({ options, onChanged, questionId }) {
    const [editedOptions, setEditedOptions] = useState({});
    const [editedCorrect, setEditedCorrect] = useState({})

    const [
        optionToDelete,
        setOptionToDelete
    ] = useState(null);

    const [editingOptionId,setEditingOptionId] = useState(null);

    const [creatingOption, setCreatingOption] =
        useState(false);

    const [newOptionText, setNewOptionText] =
        useState("");

    const [newOptionCorrect, setNewOptionCorrect] =
        useState(false);

    const createOption = async () => {

        try {

            await fetch(
                `${API_URL}/api/blocks/questions/${questionId}/options`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        text: newOptionText,
                        is_correct: newOptionCorrect
                    })
                }
            );

            toast.success(
                "Alternativ skapat"
            );

            await onChanged();

            setCreatingOption(false);
            setNewOptionText("");
            setNewOptionCorrect(false);

        } catch (error) {

            toast.error(
                "Kunde inte skapa alternativ"
            );

        }

    };

    const deleteOption = async (optionId) => {

        try {

            toast.info("Tar bort alternativ...");

            await fetch(
                `${API_URL}/api/blocks/options/${optionId}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            await onChanged();

            toast.success("Alternativet har tagits bort");

        } catch (error) {

            console.error(error);

            toast.error("Kunde inte ta bort alternativet");

        }

    };

    const updateOption = async (
        optionId,
        text,
        is_correct
    ) => {

        try {

            await fetch(
                `${API_URL}/api/blocks/options/${optionId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        text,
                        is_correct
                    })
                }
            );

            await onChanged();

            toast.success("Alternativ sparat");

        } catch (error) {

            console.error(error);

            toast.error("Kunde inte spara alternativ");

        }

    };

    return (
        <>
            {options.map(option => (

                <div
                    key={option.id}    
                    className="
                            flex
                            items-start
                            justify-between
                            py-2
                            border-b
                        "
                >

                    {editingOptionId === option.id ? (

                        <>
                            <label className="flex items-center gap-2 mb-2">

                                <input
                                    type="checkbox"
                                    checked={
                                        editedCorrect[option.id] ??
                                        option.is_correct
                                    }
                                    onChange={(e) =>
                                        setEditedCorrect({
                                            ...editedCorrect,
                                            [option.id]: e.target.checked
                                        })
                                    }
                                />

                                <span>Rätt svar</span>

                            </label>

                            <div
                                className="
                                    math-preview
                                    mb-2
                                "
                                dangerouslySetInnerHTML={{
                                    __html: formatMathText(
                                        editedOptions[option.id] ??
                                        option.text
                                    )
                                }}
                            />

                            <textarea
                                rows={3}
                                className="input-standard"
                                value={
                                    editedOptions[option.id] ??
                                    option.text
                                }
                                onChange={(e) =>
                                    setEditedOptions({
                                        ...editedOptions,
                                        [option.id]:
                                            e.target.value
                                    })
                                }
                            />

                            <div className="flex gap-2 mt-2">

                                <Button
                                    onClick={async () => {

                                    await updateOption(
                                        option.id,
                                        editedOptions[option.id] ??
                                        option.text,
                                        editedCorrect[option.id] ??
                                        option.is_correct
                                    );

                                        setEditingOptionId(null);

                                    }}
                                >
                                    Spara
                                </Button>

                                <Button
                                    onClick={() =>
                                        setEditingOptionId(null)
                                    }
                                >
                                    Avbryt
                                </Button>

                            </div>

                        </>

                    ) : (

                        <>
                            <div className="flex-1 flex items-start gap-2">

                                <div
                                    className="math-content flex-1"
                                    dangerouslySetInnerHTML={{
                                        __html: formatMathText(
                                            option.text
                                        )
                                    }}
                                />
                                <div className="flex items-center gap-2 shrink-0"></div>
                                {option.is_correct ? (
                                    <span
                                        className="
                                            bg-green-100
                                            text-green-800
                                            text-sm
                                            px-2
                                            py-1
                                            rounded
                                        "
                                    >
                                        Korrekt
                                    </span>
                                ) : (
                                    <span
                                        className="
                                            bg-red-100
                                            text-red-800
                                            text-sm
                                            px-2
                                            py-1
                                            rounded
                                        "
                                    >
                                        Felaktigt
                                    </span>
                                )}
                                <div/>

                                <Button
                                    variant="outline"
                                    onClick={() => {

                                        setEditedOptions({
                                            ...editedOptions,
                                            [option.id]: option.text
                                        });

                                        setEditedCorrect({
                                            ...editedCorrect,
                                            [option.id]: option.is_correct
                                        });

                                        setEditingOptionId(option.id);

                                    }}
                                >
                                    Redigera
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        setOptionToDelete(
                                            option.id
                                        )
                                    }
                                >
                                    Ta bort
                                </Button>

                            </div>

                        </>

                    )}

                </div>

            ))}

            <div className="mt-4">

                {!creatingOption && (

                    <Button
                        variant="outline"
                        onClick={() =>
                            setCreatingOption(true)
                        }
                    >
                        Nytt alternativ
                    </Button>

                )}

                {creatingOption && (

                    <div className="border rounded-lg p-4 mt-2">

                        <label className="flex items-center gap-2 mb-2">

                            <input
                                type="checkbox"
                                checked={newOptionCorrect}
                                onChange={(e) =>
                                    setNewOptionCorrect(
                                        e.target.checked
                                    )
                                }
                            />

                            <span>Rätt svar</span>

                        </label>

                        <textarea
                            rows={3}
                            className="input-standard mb-2"
                            value={newOptionText}
                            onChange={(e) =>
                                setNewOptionText(
                                    e.target.value
                                )
                            }
                            placeholder="Nytt alternativ..."
                        />

                        <div
                            className="math-preview mb-2"
                            dangerouslySetInnerHTML={{
                                __html: formatQuestion(
                                    newOptionText
                                )
                            }}
                        />

                        <div className="flex gap-2">

                            <Button
                                onClick={createOption}
                            >
                                Spara
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {

                                    setCreatingOption(false);
                                    setNewOptionText("");
                                    setNewOptionCorrect(false);

                                }}
                            >
                                Avbryt
                            </Button>

                        </div>

                    </div>

                )}

            </div>

            <DeleteOptionDialog
                open={optionToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setOptionToDelete(null);
                    }
                }}
                onDelete={async () => {
                    await deleteOption(
                        optionToDelete
                    );
                    setOptionToDelete(null);
                }}
            />
        </>    
            
    )    
}
