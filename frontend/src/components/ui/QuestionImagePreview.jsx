import { useState } from "react";
import { API_URL } from "@/config";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

function getMediaUrl(mediaUrl) {
    if (!mediaUrl) {
        return null;
    }

    return mediaUrl.startsWith("http")
        ? mediaUrl
        : `${API_URL}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
}

export default function QuestionImagePreview({ media = [], compact = false }) {
    const [activeMedia, setActiveMedia] = useState(null);
    const imageMedia = (Array.isArray(media) ? media : []).filter(item =>
        item && (
            item.media_type?.startsWith("image/") ||
            item.media_type === "image"
        )
    );

    if (imageMedia.length === 0) {
        return null;
    }

    return (
        <>
            <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-2"}`}>
                {imageMedia.map(item => {
                    const src = getMediaUrl(item.media_url);

                    return src ? (
                        <button
                            key={item.id}
                            type="button"
                            className="block cursor-zoom-in rounded-md text-left"
                            onClick={() => setActiveMedia(item)}
                            aria-label="Visa bilden större"
                        >
                            <img
                                src={src}
                                alt="Bild till uppgiften"
                                className={compact
                                    ? "max-h-20 max-w-32 rounded-md border object-contain"
                                    : "max-h-32 max-w-48 rounded-md border object-contain"}
                            />
                        </button>
                    ) : null;
                })}
            </div>

            <Dialog open={!!activeMedia} onOpenChange={open => !open && setActiveMedia(null)}>
                <DialogContent className="h-auto max-h-[94vh] !w-max !max-w-[calc(100vw-1rem)] p-3">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Bild till uppgiften</DialogTitle>
                        <DialogDescription>Förstorad bild till uppgiften.</DialogDescription>
                    </DialogHeader>
                    {activeMedia && (
                        <div className="max-h-[calc(94vh-2rem)] max-w-[calc(100vw-2rem)] overflow-auto rounded border bg-muted/20 p-2">
                            <img
                                src={getMediaUrl(activeMedia.media_url)}
                                alt="Bild till uppgiften"
                                className="block max-h-[calc(94vh-3rem)] max-w-[calc(100vw-3rem)] object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}