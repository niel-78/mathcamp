import MathContent from "@/components/ui/MathContent";

export default function BlockTab({ block }) {

    return (

        <div className="p-4">

            <h1 className="text-2xl font-bold mb-6">
                {block.name}
            </h1>

            {block.questions?.map(question => (

                <div
                    key={question.id}
                    className="border rounded p-4 mb-4"
                >
                    <MathContent
                        value={question.question}
                        className="p-2"
                    />

                    {question.options?.map(option => (

                        <div
                            key={option.id}
                            className={`
                                p-3
                                rounded-lg
                                border
                                mb-2
                                ${
                                    option.is_correct
                                        ? "bg-green-50 border-green-500 text-green-900"
                                        : "bg-white border-gray-300"
                                }
                            `}
                        >
                            <MathContent
                                value={option.text}
                            />
                        </div>

                    ))}

                </div>

            ))}

        </div>

    );

}