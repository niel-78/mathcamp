import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import DetailLayout
    from "@/components/layouts/DetailLayout";

import MathContent
    from "@/components/ui/MathContent";

import OptionList
    from "@/components/ui/OptionList";

import QuestionTester
    from "@/components/ui/QuestionTester";

import AnswerConfigEditor
    from "@/components/ui/AnswerConfigEditor";

import DeleteMediaDialog
    from "@/components/ui/DeleteMediaDialog";

import {
    getQuestionTypeLabel
} from "@/constants/assessmentConstants";

export default function QuestionCard({
    question,
    onChanged
}) {

    if (!question) {
        return null;
    }

    const [mediaToDelete,
        setMediaToDelete] =
        useState(null);

    const [questionText,
        setQuestionText] =
        useState(question.question);

    const [editingQuestion,
        setEditingQuestion] =
        useState(false);

    const [levels, setLevels] =
        useState([]);

    const [levelId,
        setLevelId] =
        useState(
            question.level_id ?? 2
        );

    useEffect(() => {

        const loadLevels =
            async () => {

                const response =
                    await fetch(
                        `${API_URL}/api/question-levels`,
                        {
                            headers:
                                authHeaders()
                        }
                    );

                setLevels(
                    await response.json()
                );

            };

        loadLevels();

    }, []);

    useEffect(() => {

        setQuestionText(
            question.question
        );

    }, [question.question]);

    return (

        <>

            <DetailLayout

                sidebar={

                    <div className="space-y-4">

                        <Card>

                            <CardHeader>

                                <CardTitle>
                                    Information
                                </CardTitle>

                            </CardHeader>

                            <CardContent
                                className="
                                    space-y-3
                                "
                            >

                                <div>

                                    <Badge>
                                        ID #{question.id}
                                    </Badge>

                                </div>

                                <div>

                                    <Badge
                                        variant="secondary"
                                    >
                                        {
                                            getQuestionTypeLabel(
                                                question.question_type
                                            )
                                        }
                                    </Badge>

                                </div>

                                <div>

                                    <Badge
                                        variant="outline"
                                    >
                                        {
                                            question.level_name
                                            ?? "Saknas"
                                        }
                                    </Badge>

                                </div>

                            </CardContent>

                        </Card>

                        <Card>

                            <CardHeader>

                                <CardTitle>
                                    Bedömning
                                </CardTitle>

                            </CardHeader>

                            <CardContent>

                                <AnswerConfigEditor
                                    question={question}
                                    onChanged={onChanged}
                                />

                            </CardContent>

                        </Card>

                    </div>

                }

            >

                <div className="space-y-6">

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Uppgift
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            {!editingQuestion ? (

                                <div
                                    className="
                                        flex
                                        justify-between
                                        gap-4
                                    "
                                >

                                    <MathContent
                                        value={
                                            question.question
                                        }
                                    />

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setEditingQuestion(
                                                true
                                            )
                                        }
                                    >
                                        Redigera
                                    </Button>

                                </div>

                            ) : (

                                <div
                                    className="
                                        space-y-4
                                    "
                                >

                                    <textarea
                                        rows={5}
                                        className="
                                            input-standard
                                            w-full
                                        "
                                        value={
                                            questionText
                                        }
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

                                        <Button>
                                            Spara
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setEditingQuestion(
                                                    false
                                                )
                                            }
                                        >
                                            Avbryt
                                        </Button>

                                    </div>

                                </div>

                            )}

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Media
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    gap-4
                                "
                            >

                                {question.media?.map(
                                    media => (

                                        <div
                                            key={media.id}
                                        >

                                            <img
                                                src={`${API_URL}${media.media_url}`}
                                                alt=""
                                                className="
                                                    rounded-xl
                                                    border
                                                    w-48
                                                "
                                            />

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() =>
                                                    setMediaToDelete(
                                                        media.id
                                                    )
                                                }
                                            >
                                                Ta bort
                                            </Button>

                                        </div>

                                    )
                                )}

                            </div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Svarsalternativ
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            <OptionList
                                questionId={
                                    question.id
                                }
                                options={
                                    question.options
                                }
                                onChanged={
                                    onChanged
                                }
                            />

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Testa uppgiften
                            </CardTitle>

                        </CardHeader>

                        <CardContent>

                            <QuestionTester
                                question={question}
                            />

                        </CardContent>

                    </Card>

                </div>

            </DetailLayout>

            <DeleteMediaDialog
                open={
                    mediaToDelete !== null
                }
                onOpenChange={() =>
                    setMediaToDelete(null)
                }
            />

        </>

    );

}