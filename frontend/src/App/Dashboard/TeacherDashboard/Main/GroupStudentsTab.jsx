import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import AddStudentDialog from "./GroupStudentsTab/AddStudentDialog";
import EditStudentDialog from "./GroupStudentsTab/EditStudentDialog";
import DeleteStudentDialog from "./GroupStudentsTab/DeleteStudentDialog";

export default function GroupStudentsTab( {groupId} ) {

    const [students, setStudents] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showEditStudent, setShowEditStudent] = useState(false);



    useEffect(() => {
        loadStudents();
    }, [groupId]);

    const loadStudents = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${groupId}/full`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setStudents(data.students || []);
    };

    

    return (
        <div>

            <div className="flex justify-between items-center mb-4">

                <h2 className="text-xl font-bold">
                    Elever
                </h2>

                <button
                    className="btn-action"
                    onClick={() =>
                        setEditMode(!editMode)
                    }
                >
                    {editMode
                        ? "Klar"
                        : "Redigera"}
                </button>

            </div>


            {editMode && (

                <div className="mb-4">

                    <button
                        className="btn-primary"
                        onClick={() =>
                            setShowAddStudent(true)
                        }
                    >
                        Lägg till elev
                    </button>

                </div>

            )}

            <table className="table">

                <thead>
                    <tr>
                        <th>Förnamn</th>
                        <th>Efternamn</th>
                        <th>Användarnamn</th>

                        {editMode && (
                            <th>Åtgärder</th>
                        )}
                    </tr>
                </thead>

                <tbody>

                    {students.map(student => (

                        <tr key={student.id}>

                            <td>{student.first_name}</td>

                            <td>{student.last_name}</td>

                            <td>{student.username}</td>

                            {editMode && (

                                <td>

                                    <div className="flex gap-2">

                                        <button
                                            className="btn-action"
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowEditStudent(true);
                                            }}
                                        >
                                            Redigera
                                        </button>

                                        <DeleteStudentDialog
                                            student={student}
                                            groupId={groupId}
                                            onDeleted={loadStudents}
                                        />

                                    </div>

                                </td>

                            )}

                        </tr>

                    ))}

                </tbody>

            </table>

            <AddStudentDialog
                open={showAddStudent}
                onOpenChange={setShowAddStudent}
                groupId={groupId}
                onCreated={loadStudents}
            />

            <EditStudentDialog
                open={showEditStudent}
                onOpenChange={setShowEditStudent}
                student={selectedStudent}
                onSaved={loadStudents}
            />

            

            
        </div>
    );
}