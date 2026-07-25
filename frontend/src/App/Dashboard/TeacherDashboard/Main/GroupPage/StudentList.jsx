import { useState } from "react";
import { API_URL } from "@/config";

export default function StudentList({ group, editMode, onChanged }) {
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const createStudent = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${group.id}/students`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        localStorage.getItem("token")
                },
                body: JSON.stringify({
                    email: username,
                    first_name: firstName,
                    last_name: lastName
                })
            }
        );

        const data = await response.json();

        alert(
    `Elev skapad

    Användarnamn:
    ${data.username}

    Lösenord:
    ${data.password}`
        );

        setUsername("");
        setFirstName("");
        setLastName("");

        onChanged?.();
    };

    const deleteStudent = async (userId) => {

        const confirmed = window.confirm(
            "Ta bort eleven?"
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/groups/${group.id}/students/${userId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        localStorage.getItem("token")
                }
            }
        );

        onChanged();
    };

    const resetPassword = async (student) => {

        const password = window.prompt(
            `Ange nytt lösenord för ${student.first_name}.
            Lämna tomt för att generera ett nytt.`
        );

        if (password === null) {
            return;
        }

        const response = await fetch(
            `${API_URL}/api/teacher/users/${student.id}/password`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        localStorage.getItem("token")
                },
                body: JSON.stringify({
                    password
                })
            }
        );

        const data = await response.json();

        alert(
            `Nytt lösenord:

            ${data.password}`
        );
    };


    return (
        <div className="card">

            <h3>Elever</h3>

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

                    {group.students.map(student => (

                        <tr key={student.id}>

                            <td>
                                {student.first_name}
                            </td>

                            <td>
                                {student.last_name}
                            </td>

                            <td>
                                {student.username}
                            </td>

                            {editMode && (
                                <td>

                                    <div className="flex gap-2">

                                        <button
                                            className="btn-primary"
                                            onClick={() =>
                                                resetPassword(student)
                                            }
                                        >
                                            Nytt lösenord
                                        </button>

                                        <button
                                            className="btn-danger"
                                            onClick={() =>
                                                deleteStudent(student.id)
                                            }
                                        >
                                            Ta bort
                                        </button>

                                    </div>

                                </td>
                            )}

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}