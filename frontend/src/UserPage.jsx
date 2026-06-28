import { useEffect, useState } from "react";

export default function UserPage() {
    const [user, setUser] = useState(null);
    const path = window.location.pathname;
    const key = path.split("/")[2];

    if (!key) return;

    useEffect(() => {
        const path = window.location.pathname;
        const userKey = path.split("/")[2];
        const examKey = path.split("/")[3];

        fetch(`http://192.168.1.115:3000/api/login/${key}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Invalid key");
                }
                return res.json();
            })
            .then(setUser)
            .catch(() => {
                alert("Ogiltig länk");
            });
        }, 
    []);
        
    return (
        <div className="user-container">
            <h1>UserPage</h1>
        </div>

    );
}
