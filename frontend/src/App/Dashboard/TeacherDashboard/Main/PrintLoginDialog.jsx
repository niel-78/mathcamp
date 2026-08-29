import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { useState } from "react";
import ReactDOMServer from "react-dom/server";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import GroupLoginPrintView from "@/components/print/GroupLoginPrintView";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function PrintLoginDialog({
    open,
    onOpenChange,
    group
}) {

    const [generating, setGenerating] = useState(false);

    const generateLogins = async () => {

        setGenerating(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/groups/${group.groupId}/reset-passwords`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const credentials =
                await response.json();

            const html =
                ReactDOMServer.renderToStaticMarkup(

                    <GroupLoginPrintView
                        groupName={
                            group.groupName
                        }
                        credentials={
                            credentials
                        }
                    />

                );

            const printWindow =
                window.open(
                    "",
                    "_blank"
                );

            printWindow.document.write(`
                <!DOCTYPE html>

                <html>

                    <head>

                        <title>
                            Inloggningsuppgifter
                        </title>

                    </head>

                    <body>

                        ${html}

                    </body>

                </html>
            `);

            printWindow.document.close();

            printWindow.focus();

            setTimeout(() => {

                printWindow.print();

                printWindow.close();

            }, 500);

            onOpenChange(false);

        } finally {

            setGenerating(false);

        }


    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Generera inloggningar
                    </DialogTitle>

                </DialogHeader>

                <p>
                    Detta kommer att skapa nya lösenord
                    för alla elever i gruppen.
                </p>

                <div className="flex justify-end gap-2">

                    <Button
                        variant="outline"
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Avbryt
                    </Button>

                    <Button
                        onClick={generateLogins}
                        disabled={generating}
                    >
                        {
                            generating
                                ? "Genererar..."
                                : "Generera"
                        }
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}