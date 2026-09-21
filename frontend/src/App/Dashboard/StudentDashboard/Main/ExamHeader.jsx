import { isSEB } from "@/utils/isSEB";
import { AlertTriangle } from "lucide-react";

export default function ExamHeader({
    title = ""
}) {

    return (
        <div className="mb-4">

            {!isSEB() && (
                <div className="warning-text hidden md:block">
                    <AlertTriangle className="mr-1 inline-block h-4 w-4" aria-hidden="true" />
                    Du kör inte i Safe Exam Browser!
                </div>
            )}

            {title && <h1>{title}</h1>}

        </div>
    );
}