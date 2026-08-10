import TeacherDashboard from "./Dashboard/TeacherDashboard";
import StudentDashboard from "./Dashboard/StudentDashboard";

function Dashboard({ user }) {

    if (
        user.active_school
    ) {
        return <TeacherDashboard />;
    }

    if (
        user.role === "student"
    ) {
        return <StudentDashboard />;
    }

    return (
        <div>
            Ingen behörighet
        </div>
    );

}

export default Dashboard;
