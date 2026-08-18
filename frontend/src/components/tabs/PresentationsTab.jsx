import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    useEffect,
    useState,
    openTab
} from "react";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";

import {
    Button
} from "@/components/ui/button";

import PresentationLibrary from "@/components/ui/PresentationLibrary";

export default function PresentationsTab({
    openTab
}) {

    const [
        presentations,
        setPresentations
    ] = useState([]);

    useEffect(() => {

        loadPresentations();

    }, []);

    async function loadPresentations() {

        const response = await fetch(
            `${API_URL}/api/presentations`,
            {
                headers: authHeaders()
            }
        );

        const data =
            await response.json();

        setPresentations(data);

    }

    return (

        <BaseTabLayout

            title="Presentationer"

            actions={
                <div className="flex gap-2">

                    <Button
                        onClick={() =>
                            openTab({
                                id: "new-presentation",
                                title: "Ny presentation",
                                type: "presentation-editor"
                            })
                        }
                    >
                        Ny presentation
                    </Button>

                </div>
            }

        >

            <PresentationLibrary

                presentations={
                    presentations
                }

                openTab={
                    openTab
                }

            />

        </BaseTabLayout>

    );

}