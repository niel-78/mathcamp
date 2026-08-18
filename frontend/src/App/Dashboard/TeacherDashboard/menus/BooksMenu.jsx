import { Button } from "@/components/ui/button";

export default function BooksMenu({
    onCreateBook
}) {

    return (

        <div className="context-menu">

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onCreateBook}
            >
                Ny bok
            </Button>

        </div>

    );

}