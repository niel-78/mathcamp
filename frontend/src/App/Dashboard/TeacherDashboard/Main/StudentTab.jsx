export default function StudentTab({
    studentId
}) {

    return (

        <div className="p-6">

            <h1 className="text-2xl font-bold">
                Elev
            </h1>

            <div>
                Student ID: {studentId}
            </div>

        </div>

    );

}