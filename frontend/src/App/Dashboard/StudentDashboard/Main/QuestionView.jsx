import TextQuestion from "./TextQuestion";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultiChoiceQuestion from "./MultiChoiceQuestion";

export default function QuestionView({
    question,
    answer,
    onTextAnswer,
    onSingleChoice,
    onMultiChoice
}) {

    switch (question.question_type) {

        case 'text':
            return (
                <TextQuestion
                    question={question}
                    value={answer}
                    onBlur={value =>
                        onTextAnswer(
                            question.id,
                            value
                        )
                    }
                />
            );

        case 'single_choice':
            return (
                <SingleChoiceQuestion
                    question={question}
                    value={answer}
                    onChange={optionId =>
                        onSingleChoice(
                            question.id,
                            optionId
                        )
                    }
                />
                            );

        case 'multiple_choice':
            return (
                <MultiChoiceQuestion
                    question={question}
                    value={answer || []}
                    onChange={optionId =>
                        onMultiChoice(
                            question.id,
                            optionId
                        )
                    }
                />
            );

        default:
            return (
                <p>
                    Okänd frågetyp: {question.question_type}
                </p>
            );
    }
}