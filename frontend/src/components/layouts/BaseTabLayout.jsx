import { useEffect, useRef } from "react";

export default function BaseTabLayout({
    title,
    actions,
    children,
    scrollKey
}) {

    const contentRef = useRef(null);
    const storageKey = scrollKey ? `tab-scroll:${scrollKey}` : null;

    useEffect(() => {
        const content = contentRef.current;
        if (!content || !storageKey) return undefined;

        const savedPosition = Number(sessionStorage.getItem(storageKey) || 0);
        let restored = false;

        const restorePosition = () => {
            if (restored || content.scrollHeight <= content.clientHeight && savedPosition > 0) {
                return;
            }

            content.scrollTop = savedPosition;
            restored = true;
        };

        const savePosition = () => {
            sessionStorage.setItem(storageKey, String(content.scrollTop));
        };

        restorePosition();
        content.addEventListener("scroll", savePosition, { passive: true });

        const observer = new ResizeObserver(restorePosition);
        observer.observe(content);

        return () => {
            savePosition();
            observer.disconnect();
            content.removeEventListener("scroll", savePosition);
        };
    }, [storageKey]);

    return (

        <div className="tab-surface">

            <div className="tab-header">

                <h1
                    className="
                        text-lg
                        font-semibold
                        min-w-0
                        truncate
                    "
                >
                    {title}
                </h1>

                <div className="tab-actions">
                    {actions}
                </div>

            </div>

            <div ref={contentRef} className="tab-content">
                {children}
            </div>

        </div>

    );

}