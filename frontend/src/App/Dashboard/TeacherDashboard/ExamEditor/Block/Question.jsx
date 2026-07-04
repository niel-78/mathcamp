import OptionList from "./Question/OptionList";

export default function Question({ question }) {

    return (
        <div>
            <p>{question.question}</p>

            <OptionList
                options={question.options}
            />
        </div>
    );
}
