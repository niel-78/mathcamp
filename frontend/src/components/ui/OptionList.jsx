import { useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import MathContent from "@/components/ui/MathContent";
import OptionCard from "@/components/ui/OptionCard";
import OptionEditor from "@/components/ui/OptionEditor";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DeleteOptionDialog from "@/components/ui/DeleteOptionDialog";

export default function OptionList({ options, onChanged, questionId }) {
    
    if (!options) {
        return null;
    }

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

            <div className="grid gap-4">

                {options.map(option => (

                    editingOptionId === option.id

                        ? (

                            <OptionEditor
                                key={option.id}
                                text={
                                    editedOptions[
                                        option.id
                                    ] ?? option.text
                                }
                                isCorrect={
                                    editedCorrect[
                                        option.id
                                    ] ?? option.is_correct
                                }
                                onTextChange={(value) =>
                                    setEditedOptions({
                                        ...editedOptions,
                                        [option.id]: value
                                    })
                                }
                                onCorrectChange={(value) =>
                                    setEditedCorrect({
                                        ...editedCorrect,
                                        [option.id]: value
                                    })
                                }
                                onSave={async () => {

                                    await updateOption(
                                        option.id,
                                        editedOptions[
                                            option.id
                                        ] ?? option.text,
                                        editedCorrect[
                                            option.id
                                        ] ?? option.is_correct
                                    );

                                    setEditingOptionId(
                                        null
                                    );

                                }}
                                onCancel={() =>
                                    setEditingOptionId(
                                        null
                                    )
                                }
                            />

                        )

                        : (

                            <OptionCard
                                key={option.id}
                                option={option}
                                onEdit={() => {

                                    setEditedOptions({
                                        ...editedOptions,
                                        [option.id]:
                                            option.text
                                    });

                                    setEditedCorrect({
                                        ...editedCorrect,
                                        [option.id]:
                                            option.is_correct
                                    });

                                    setEditingOptionId(
                                        option.id
                                    );

                                }}
                                onDelete={() =>
                                    setOptionToDelete(
                                        option.id
                                    )
                                }
                            />

                        )

                ))}

            </div>

            <div className="mt-4">

                {!creatingOption && (

                    <div
                        className="
                            border-2
                            border-dashed
                            border-border

                            rounded-xl

                            p-6

                            text-center

                            cursor-pointer

                            hover:bg-accent

                            transition-colors
                        "
                        onClick={() =>
                            setCreatingOption(true)
                        }
                    >
                        + Nytt alternativ
                    </div>

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
                        <MathContent
                                className="
                                    math-preview
                                    mb-2
                                "
                                value={newOptionText}
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
