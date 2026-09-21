import { isSEB } from "@/utils/isSEB";

export default function ExamHeader({
    title = ""
}) {

    return (
        <div className="mb-4">

            {!isSEB() && (
                <div className="warning-text hidden md:block">
                    ⚠️ Du kör inte i Safe Exam Browser!
                </div>
            )}

            {title && <h1>{title}</h1>}

        </div>
    );
}