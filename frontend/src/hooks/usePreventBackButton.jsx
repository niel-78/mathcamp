import { useEffect } from "react";

export function usePreventBackButton() {

    useEffect(() => {
        window.history.pushState(
            null,
            "",
            window.location.href
        );

        const onPop = () => {
            window.history.pushState(
                null,
                "",
                window.location.href
            );
        };

        window.addEventListener(
            "popstate",
            onPop
        );

        return () =>
            window.removeEventListener(
                "popstate",
                onPop
            );
    }, []);
}