export default function MetaItem({
    icon: Icon,
    label,
    value
}) {

    return (

        <div
            className="
                flex
                items-center
                gap-2
            "
        >

            <Icon
                size={16}
                className="
                    text-muted-foreground
                "
            />

            <div>

                <div
                    className="
                        font-medium
                    "
                >
                    {label}
                </div>

                <div
                    className="
                        text-muted-foreground
                    "
                >
                    {value}
                </div>

            </div>

        </div>

    );

}