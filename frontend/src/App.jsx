// import Login from "./App/Login";
// import Dashboard from "@/App/Dashboard";
// import { useAuth } from "@/contexts/AuthContext";
// import { Toaster } from "@/components/ui/sonner";

// export default function App() {
//     const { user, loading } = useAuth();

//     if (loading) {
//         return (
//             <>
//                 <div>Laddar...</div>
//                 <Toaster />
//             </>
//         );
//     }

//     return (
//         <>
//             {!user
//                 ? <Login />
//                 : <Dashboard user={user} />
//             }

//             <Toaster />
//         </>
//     );
// }

import Login from "./App/Login";
import Dashboard from "@/App/Dashboard";
import SharedPlanningPage from "@/pages/SharedPlanningPage";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function App() {

    const { user, loading } =
        useAuth();

    if (loading) {
        return (
            <>
                <div>Laddar...</div>
                <Toaster />
            </>
        );
    }

    const path =
        window.location.pathname;

    if (
        path.startsWith(
            "/shared-planning/"
        )
    ) {
        return (
            <>
                <SharedPlanningPage />
                <Toaster />
            </>
        );
    }

    return (
        <>
            {!user
                ? <Login />
                : <Dashboard user={user} />
            }

            <Toaster />
        </>
    );

}