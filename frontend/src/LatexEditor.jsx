import { useState } from "react";
import { renderLatex } from "./utils/renderLatex";

export default function LatexEditor() {
    const [value, setValue] = useState(
        "Lös denna: $\\int f(x) \\, dx$"
    );

    return (
        <div style={{ maxWidth: 600, margin: "20px auto" }}>
            <h2>Skriv fråga</h2>

            <textarea
                rows={4}
                style={{ width: "100%", padding: 10 }}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />

            <h3>Preview:</h3>

            <div style={{ padding: 10, border: "1px solid #ccc" }}>
                {renderLatex(value)}
            </div>
        </div>
    );
}
