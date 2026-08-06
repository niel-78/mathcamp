export default function BaseTabLayout({
    title,
    actions,
    children
}) {

    return (

        <div className="tab-surface">

            <div className="tab-header">

                <h1
                    className="
                        text-lg
                        font-semibold
                    "
                >
                    {title}
                </h1>

                {actions}

            </div>

            <div className="tab-content">
                {children}
            </div>

        </div>

    );

}