import TeacherDashboard from "./Dashboard/TeacherDashboard";
import StudentDashboard from "./Dashboard/StudentDashboard";

function Dashboard({ user }) {

    switch (user.role) {

        case "teacher":
            return <TeacherDashboard />;

        case "super":
            return <TeacherDashboard />;

        case "student":
            return <StudentDashboard />;

        default:
            return <div>Ingen behörighet</div>;

    }

}

export default Dashboard;