export default function GroupLoginPrintView({
    groupName,
    credentials
}) {

    return (

        <div
            style={{
                padding: "20px",
                fontFamily: "Arial, sans-serif"
            }}
        >

            <h1>
                {groupName}
            </h1>

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse"
                }}
            >

                <thead>

                    <tr>

                        <th style={th}>
                            Visningsnamn
                        </th>

                        <th style={th}>
                            Användarnamn
                        </th>

                        <th style={th}>
                            Lösenord
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {credentials.map(student => (

                        <tr key={student.id}>

                            <td style={td}>
                                {student.display_name}
                            </td>

                            <td style={td}>
                                {student.username}
                            </td>

                            <td style={td}>
                                {student.password}
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

const th = {
    border: "1px solid black",
    padding: "8px",
    textAlign: "left",
    background: "#eee"
};

const td = {
    border: "1px solid black",
    padding: "8px"
};