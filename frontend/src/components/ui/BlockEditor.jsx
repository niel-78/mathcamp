import Question from "@/components/ui/Question";

export default function BlockEditor({
    block,
    editMode,
    onChanged,
    examId
}) {

    const createBlock = async () => {

        if (!newBlock.trim()) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: newBlock
                })
            }
        );

        setNewBlock("");

        loadExam();

        setTimeout(() => {
            blockRef.current?.focus();
        }, 0);

    };

    return (
        <div className="block-editor">

            <h3>{block.name}</h3>
            {console.log(block)}
            {block.questions.map(question => (
                <Question
                    key={question.id}
                    question={question}
                    editMode={editMode}
                    onChanged={onChanged}
                />
            ))}
        </div>
    );
}