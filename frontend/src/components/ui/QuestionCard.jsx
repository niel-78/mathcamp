import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MathContent from "@/components/ui/MathContent";
import OptionList from "@/components/ui/OptionList";
import DeleteMediaDialog from "@/components/ui/DeleteMediaDialog";
import QuestionTester from "@/components/ui/QuestionTester";
import AnswerConfigEditor from "@/components/ui/AnswerConfigEditor";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import DetailLayout from "@/components/layouts/DetailLayout";
import CardSection from "@/components/layouts/CardSection";
import { GRADING_MODES, QUESTION_TYPES, getQuestionTypeLabel, getGradingModeLabel } from "@/constants/assessmentConstants";

export default function QuestionCard({
    question,
    onChanged
}) {

    if (!question) {
        return null;
    }

    const answerConfig =
    typeof question.answer_config === "string"
        ? JSON.parse(question.answer_config)
        : (question.answer_config || {});

    const [editingQuestionText,
        setEditingQuestionText] =
        useState(false);

    const [questionText,
        setQuestionText] =
        useState(question.question);

    const [
        mediaToDelete,
        setMediaToDelete
    ] = useState(null);

    const [editingLevel, setEditingLevel] =
        useState(false);

    const [questionType, setQuestionType] =
        useState(question.question_type);

    const [uploadingMedia, setUploadingMedia] = useState(false);

    const [levelId, setLevelId] = useState(
        question.level_id ?? 2
    );

    const [levels, setLevels] = useState([]);

    useEffect(() => {

        const loadLevels = async () => {

            const response = await fetch(
                `${API_URL}/api/question-levels`,
                {
                    headers: authHeaders()
                }
            );

            const data = await response.json();

            setLevels(data);

        };

        loadLevels();

    }, []);

    useEffect(() => {
        setQuestionText(question.question);
    }, [question.question]);
    
    useEffect(() => {
        setLevelId(
            question.level_id ?? 2
        );
    }, [question.level_id]);

    const saveQuestion = async () => {

        await fetch(
            `${API_URL}/api/questions/${question.id}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: questionText,
                    question_type: question.question_type,
                    answer_config: question.answer_config
                })
            }
        );

        await onChanged();

        setEditingQuestionText(false);

        toast.success("Fråga sparad");

    };

    const uploadMedia = async (e) => {

        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        try {

            const response = await fetch(
                `${API_URL}/api/questions/${question.id}/media`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error();
            }

            await onChanged();

            toast.success(
                "Media uppladdat"
            );

        } catch {

            toast.error(
                "Kunde inte ladda upp media"
            );

        }

    };

    const deleteMedia = async (mediaId) => {

        try {

            await fetch(
                `${API_URL}/api/questions/media/${mediaId}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            await onChanged();

            toast.success("Media borttaget");

        } catch (error) {

            console.error(error);

            toast.error("Kunde inte ta bort media");

        }

    };

    const saveLevel = async () => {

        try {

            await fetch(
                `${API_URL}/api/questions/${question.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question: question.question,
                        question_type: question.question_type,
                        answer_config: question.answer_config,
                        level_id: levelId
                    })
                }
            );

            await onChanged();

            setEditingLevel(false);

            toast.success("Nivå sparad");

        } catch (error) {

            console.error(error);

            toast.error("Kunde inte spara nivå");

        }

    };

    return (
        <>
            <DetailLayout

                sidebar={

                    <>

                        <CardSection
                            title="Information"
                        >

                            <div className="space-y-3">

                                <div>

                                    <strong>ID:</strong>
                                    {" "}
                                    {question.id}

                                </div>

                                <div>

                                    <strong>Typ:</strong>
                                    {" "}
                                    {
                                        getQuestionTypeLabel(
                                            question.question_type
                                        )
                                    }

                                </div>

                                <div>

                                    <strong>Nivå:</strong>
                                    {" "}
                                    {
                                        question.level_name
                                            ?? "Saknas"
                                    }

                                </div>

                            </div>

                        </CardSection>

                        <CardSection
                            title="Nivå"
                        >

                            {!editingLevel ? (

                                <div className="space-y-3">

                                    <div>
                                        {question.level_name
                                            ?? "Saknas"}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setEditingLevel(true)
                                        }
                                    >
                                        Redigera
                                    </Button>

                                </div>

                            ) : (

                                <div className="space-y-3">

                                    <select
                                        className="
                                            input-standard
                                        "
                                        value={levelId ?? 2}
                                        onChange={(e) =>
                                            setLevelId(
                                                Number(
                                                    e.target.value
                                                )
                                            )
                                        }
                                    >

                                        {levels.map(level => (

                                            <option
                                                key={level.id}
                                                value={level.id}
                                            >
                                                {level.name}
                                            </option>

                                        ))}

                                    </select>

                                    <div
                                        className="
                                            flex
                                            gap-2
                                        "
                                    >

                                        <Button
                                            size="sm"
                                            onClick={saveLevel}
                                        >
                                            Spara
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setEditingLevel(
                                                    false
                                                )
                                            }
                                        >
                                            Avbryt
                                        </Button>

                                    </div>

                                </div>

                            )}

                        </CardSection>

                        <CardSection
                            title="Bedömning"
                        >

                            <AnswerConfigEditor
                                question={question}
                                onChanged={onChanged}
                            />

                        </CardSection>

                    </>

                }

            >


                <CardSection
                    title="Media"
                >

                    <div className="space-y-4">

                        <div
                            className="
                                flex
                                flex-wrap
                                gap-4
                                items-start
                            "
                        >

                            {question.media?.map(media => (

                                <div
                                    key={media.id}
                                    className="
                                        w-48
                                        border
                                        border-border
                                        rounded-xl
                                        overflow-hidden
                                        flex
                                        flex-col
                                    "
                                >

                                    <img
                                        src={`${API_URL}${media.media_url}`}
                                        alt="Bild"
                                    />

                                    <div
                                        className="
                                            p-3
                                            flex
                                            justify-end
                                        "
                                    >

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                setMediaToDelete(
                                                    media.id
                                                )
                                            }
                                        >
                                            Ta bort
                                        </Button>

                                    </div>

                                </div>

                            ))}

                            <label
                                className="
                                    cursor-pointer
                                "
                            >

                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={uploadMedia}
                                />

                                <div
                                    className="
                                        w-48
                                        h-[180px]

                                        border-2
                                        border-dashed
                                        border-border

                                        rounded-xl

                                        flex
                                        items-center
                                        justify-center

                                        text-muted-foreground

                                        hover:bg-accent
                                        hover:text-accent-foreground

                                        transition-colors
                                    "
                                >
                                    + Ladda upp
                                </div>

                            </label>

                        </div>

                        {(!question.media ||
                            question.media.length === 0) && (

                            <p
                                className="
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                Inget media uppladdat ännu.
                            </p>

                        )}

                    </div>

                </CardSection>


                <CardSection
                    title={`Uppgift ID: ${question.id}`}
                >

                    {!editingQuestionText ? (

                        <div
                            className="
                                flex
                                justify-between
                                items-start
                                gap-4
                            "
                        >

                            <div className="flex-1">

                                <MathContent
                                    value={question.question}
                                />

                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {

                                    setQuestionText(
                                        question.question
                                    );

                                    setEditingQuestionText(
                                        true
                                    );

                                }}
                            >
                                Redigera
                            </Button>

                        </div>

                    ) : (

                        <div className="space-y-4">

                            <div
                                className="
                                    math-preview
                                    border
                                    border-border
                                    rounded-lg
                                    p-3
                                    bg-muted
                                "
                            >

                                <MathContent
                                    value={questionText}
                                />

                            </div>

                            <textarea
                                rows={4}
                                className="
                                    input-standard
                                    w-full
                                "
                                value={questionText}
                                onChange={(e) =>
                                    setQuestionText(
                                        e.target.value
                                    )
                                }
                            />

                            <div
                                className="
                                    flex
                                    justify-end
                                    gap-2
                                "
                            >

                                <Button
                                    onClick={saveQuestion}
                                >
                                    Spara
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setEditingQuestionText(
                                            false
                                        )
                                    }
                                >
                                    Avbryt
                                </Button>

                            </div>

                        </div>

                    )}

                </CardSection>

                <CardSection
                    title="Svarsalternativ"
                >
                    <OptionList
                        questionId={question.id}
                        options={question.options}
                        onChanged={onChanged}
                    />
                </CardSection>

                <CardSection
                    title="Testa uppgiften"
                >

                    <QuestionTester
                        question={question}
                    />

                </CardSection>

            </DetailLayout>
            <DeleteMediaDialog
                open={mediaToDelete !== null}
                onOpenChange={(open) => {

                    if (!open) {
                        setMediaToDelete(null);
                    }

                }}
                onDelete={async () => {

                    await deleteMedia(
                        mediaToDelete
                    );

                    setMediaToDelete(null);

                }}
            />
        </>

    );

    return (
        <div className="space-y-4">

        <div className="border-b pb-2 mb-4">
            <h2 className="text-2xl font-bold tracking-tight">
                Uppgift ID: {question.id}
            </h2>
        </div>

            {question.media?.length > 0 && (

                <div className="space-y-2">

                    {question.media.map(media => (

                    <div key={media.id}>
                        <img
                            src={`${API_URL}${media.media_url}`}
                            alt=""
                            className="
                                max-w-md
                                w-full
                                h-auto
                                rounded-lg
                                border
                            "
                        />

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setMediaToDelete(media.id)
                            }}
                        >
                            Ta bort
                        </Button>
                    </div>

                    ))}

                </div>

            )}

            <div className="flex justify-end">

                <label className="cursor-pointer">

                    <input
                        type="file"
                        className="hidden"
                        onChange={uploadMedia}
                    />

                    <span
                        className="
                            inline-flex
                            h-8
                            items-center
                            rounded-2xl
                            border
                            px-3
                            text-sm
                        "
                    >
                        Ladda upp media
                    </span>

                </label>

            </div>
            
            
            <div className="space-y-4">

                <div
                    className="
                    border
                    rounded-lg
                    p-4
                    bg-white
                    space-y-4
                    "
                >

                    {!editingQuestionText && (

                        <div
                            className="
                                flex
                                justify-between
                                items-start
                                gap-4
                            "
                        >

                            <div className="flex-1">

                                <MathContent
                                    value={question.question}
                                />

                            </div>

                            <div className="flex gap-2 shrink-0">

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {

                                        setQuestionText(
                                            question.question
                                        );

                                        setEditingQuestionText(
                                            true
                                        );

                                    }}
                                >
                                    Redigera
                                </Button>

                            </div>

                        </div>

                    )}

                    {editingQuestionText && (

                        <div className="space-y-2">

                            <div
                                className="
                                    math-preview
                                    border
                                    rounded-lg
                                    p-3
                                    bg-gray-50
                                "
                            >
                                <MathContent
                                    value={questionText}
                                />
                            </div>

                            <textarea
                                rows={4}
                                className="input-standard"
                                value={questionText}
                                onChange={(e) =>
                                    setQuestionText(
                                        e.target.value
                                    )
                                }
                            />

                            <div className="flex justify-end gap-2">

                                <Button
                                    onClick={saveQuestion}
                                >
                                    Spara
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setEditingQuestionText(
                                            false
                                        )
                                    }
                                >
                                    Avbryt
                                </Button>

                            </div>

                        </div>

                    )}
                </div>    

                <OptionList
                    questionId={question.id}
                    options={question.options}
                    onChanged={onChanged}
                />

                <QuestionTester
                    question={question}
                />

                <div
                    className="
                        flex
                        justify-between
                        items-center
                        py-2
                        border-b
                    "
                >
                    {!editingLevel ? (

                        <>

                            <div>
                                <strong>Nivå:</strong>{" "}
                                {question.level_name ?? 'Saknas'}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setEditingLevel(true)
                                }
                            >
                                Redigera
                            </Button>

                        </>

                    ) : (

                        <>

                            <select
                                className="input-standard"
                                value={levelId ?? 2}
                                onChange={(e) =>
                                    setLevelId(
                                        Number(e.target.value)
                                    )
                                }
                            >
                                {levels.map(level => (
                                    <option
                                        key={level.id}
                                        value={level.id}
                                    >
                                        {level.name}
                                    </option>
                                ))}
                            </select>


                            <div className="flex gap-2">

                                <Button
                                    size="sm"
                                    onClick={saveLevel}
                                >
                                    Spara
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setEditingLevel(false)
                                    }
                                >
                                    Avbryt
                                </Button>

                            </div>

                        </>

                    )}

                </div>

                <AnswerConfigEditor
                    question={question}
                    onChanged={onChanged}
                />    
                        
            </div>

            <DeleteMediaDialog
                open={mediaToDelete !== null}
                onOpenChange={(open) => {

                    if (!open) {
                        setMediaToDelete(null);
                    }

                }}
                onDelete={async () => {

                    await deleteMedia(
                        mediaToDelete
                    );

                    setMediaToDelete(null);

                }}
            />
        </div>    

    );
}    