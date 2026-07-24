import { useState } from "react";
import ExamList from "./TeacherDashboard/ExamList";
import ExamEditor from "./TeacherDashboard/ExamEditor";
import GroupPage from "./TeacherDashboard/GroupPage";

function TeacherDashboard() {
    const [selectedExam, setSelectedExam] = useState(null);

    return (
        <>
            <GroupPage/>
            {!selectedExam ? (
                <ExamList
                    onSelect={setSelectedExam}
                />
            ) : (
                <ExamEditor
                    examId={selectedExam}
                    onClose={() => setSelectedExam(null)}
                />
            )}
        </>
    );

}

export default TeacherDashboard;