import { isSEB } from "@/utils/isSEB";
import { AlertTriangle } from "lucide-react";

export default function ExamHeader({
    attemptId,
    title = "Prov"
}) {

    return (
        <div className="mb-4">

            {!isSEB() && (
                <div className="warning-text">
                    <AlertTriangle className="mr-1 inline-block h-4 w-4" aria-hidden="true" />
                    Du kör inte i Safe Exam Browser!
                </div>
            )}

            <h1>{title}</h1>

            <p>
                Försök: {attemptId}
            </p>

        </div>
    );
}