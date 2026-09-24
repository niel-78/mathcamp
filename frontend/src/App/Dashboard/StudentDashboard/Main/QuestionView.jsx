import TextQuestion from "./TextQuestion";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultiChoiceQuestion from "./MultiChoiceQuestion";
import NumericInputQuestion from "./NumericInputQuestion";
import MathQuestionMedia from "./MathQuestionMedia";

export default function QuestionView({
    question,
    answer,
    onTextAnswer,
    onSingleChoice,
    onMultiChoice,
    questionTextClassName = "text-base",
    attemptId
}) {

    let questionContent;

    switch (question.question_type) {

        case 'expression':
        case 'text':
            questionContent = (
                <TextQuestion
                    question={question}
                    value={answer}
                    questionTextClassName={questionTextClassName}
                    onBlur={value =>
                        onTextAnswer(
                            question.id,
                            value
                        )
                    }
                />
            );
            break;

        case 'numeric_input':
        case 'equation':
            questionContent = (
                <NumericInputQuestion
                    question={question}
                    value={answer}
                    questionTextClassName={questionTextClassName}
                    onBlur={value =>
                        onTextAnswer(
                            question.id,
                            value
                        )
                    }
                />
            );
            break;

        case 'single_choice':
            questionContent = (
                <SingleChoiceQuestion
                    question={question}
                    value={answer}
                    questionTextClassName={questionTextClassName}
                    onChange={optionId =>
                        onSingleChoice(
                            question.id,
                            optionId
                        )
                    }
                />
                            );
            break;

        case 'multiple_choice':
            questionContent = (
                <MultiChoiceQuestion
                    question={question}
                    value={answer || []}
                    questionTextClassName={questionTextClassName}
                    onChange={optionId =>
                        onMultiChoice(
                            question.id,
                            optionId
                        )
                    }
                />
            );
            break;

        default:
            questionContent = (
                <p>
                    Okänd frågetyp: {question.question_type}
                </p>
            );
            break;
    }

    return (
        <div className="mx-auto mt-10 w-full max-w-3xl rounded-lg border bg-card p-5 text-left shadow-sm sm:p-7">
            <MathQuestionMedia
                media={question.media}
                attemptId={attemptId}
            />
            {questionContent}
        </div>
    );
}