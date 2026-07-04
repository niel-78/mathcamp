import Question from "./Block/Question";

export default function Block({ block, loadExam }) {
    return (
        <div>
            <h3>{block.name}</h3>

            {block.questions.map(question => (
                <Question
                    key={question.id}
                    question={question}
                    onUpdated={loadExam}
                />
            ))}
        </div>
    );
}
