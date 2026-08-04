import { isSEB } from "@/utils/isSEB";

export default function ExamHeader({
    attemptId,
    title = "Prov"
}) {

    return (
        <div className="mb-4">

            {!isSEB() && (
                <div className="warning-text">
                    ⚠️ Du kör inte i Safe Exam Browser!
                </div>
            )}

            <h1>{title}</h1>

            <p>
                Försök: {attemptId}
            </p>

        </div>
    );
}