import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";
import FormatDate from "@/utils/FormatDate";

export default function BlockCard({
    block,
    openTab,
    onDelete
}) {
    
    const firstQuestion =
        block.questions?.[0];

    return (
        <div className="border rounded p-4">

            <p className="font-semibold">
                ID: {block.id}
            </p>

            {block.questions?.length > 0 && (

                <MathContent
                    value={block.questions[0].question}
                    className="p-2"
                />

            )}

            <p className="mt-2 text-sm text-gray-500">
                {block.questions?.length ?? 0}
                {" "}
                {block.questions?.length == 1 ? "fråga" : "frågor"}
            </p>

            <div className="mt-3">

                <h4 className="font-semibold text-sm">
                    Referenser
                </h4>

                {block.centralContent?.length > 0 && (
                    <>
                        <p className="text-xs text-muted-foreground">
                            Centralt innehåll
                        </p>

                        {block.centralContent.map(item => (
                            <div key={item.id}>
                                {item.content}
                            </div>
                        ))}
                    </>
                )}

                {block.bookSections?.length > 0 && (
                    <>
                        <p className="text-xs text-muted-foreground mt-2">
                            Bok
                        </p>

                        {block.bookSections.map(section => (
                            <div key={section.id}>
                                {section.title}
                            </div>
                        ))}
                    </>
                )}

            </div>

            <p>
                Skapad av
                {block.created_by_first_name}
                {" "}
                {block.created_by_last_name}
                den 
                <FormatDate value={block.created_at} />
            </p>

            <p>
                Uppdaterad av
                {block.created_by_first_name}
                {" "}
                {block.created_by_last_name}
                den
                <FormatDate value={block.updated_at} />
            </p>

            <button
                className="mt-3"
                onClick={() =>
                    openTab({
                        id: `block-${block.id}`,
                        title: `ID: ${block.id}`,
                        type: "block",
                        block
                    })
                }
            >
                Öppna
            </button>

            <Button
                variant="destructive"
                onClick={() => onDelete(block.id)}
            >
                Radera
            </Button>

        </div>
    );
}