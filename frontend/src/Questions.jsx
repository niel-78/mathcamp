import { useEffect, useState } from "react";
import { renderLatex } from "./utils/renderLatex";

function Questions() {
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        fetch("http://192.169.1.115:3000/api/questions")
        .then(res => res.json())
        .then(data => setQuestions(data));
    }, []);

    return (
        <div>
        <h1>Questions</h1>
            {questions.map(u => (
            <p key={u.id}>{renderLatex(u.question)}</p>
        ))}
        </div>
    );
}

export default Questions;