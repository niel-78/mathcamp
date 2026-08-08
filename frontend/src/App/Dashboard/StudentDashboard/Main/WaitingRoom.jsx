export default function WaitingRoomPage({
    groupExamId,
    examTitle
}) {

    useEffect(() => {

        const interval = setInterval(
            checkStatus,
            3000
        );

        return () =>
            clearInterval(interval);

    }, []);

    async function checkStatus() {

        const response = await fetch(
            `${API_URL}/api/group-exam-lobby/${groupExamId}/status`,
            {
                headers: authHeaders()
            }
        );

        const data =
            await response.json();

        if (data.exam_status === "open") {

            const startResponse =
                await fetch(
                    `${API_URL}/api/exam-attempts/start`,
                    {
                        method: "POST",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            group_exam_id:
                                groupExamId
                        })
                    }
                );

            const attempt =
                await startResponse.json();

            // navigera till ExamPage
        }
    }

    return (
        <div
            className="
                flex
                items-center
                justify-center
                min-h-screen
            "
        >
            <Card className="w-full max-w-lg">
                <CardContent className="p-8 text-center">

                    <h1 className="text-2xl font-bold">
                        {examTitle}
                    </h1>

                    <p className="mt-4">
                        Du är ansluten till väntrummet.
                    </p>

                    <p className="text-muted-foreground">
                        Väntar på att läraren startar provet...
                    </p>

                </CardContent>
            </Card>
        </div>
    );
}