import { useAuth } from "@/contexts/AuthContext";

export default function UserProfile() {

    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="border-b p-4">

            <div className="flex items-center gap-3">

                <div
                    className="
                        w-10 h-10
                        rounded-full
                        bg-slate-300
                        flex
                        items-center
                        justify-center
                        font-semibold
                    "
                >
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                </div>

                <div>

                    <div className="font-semibold">
                        {user.first_name} {user.last_name}
                    </div>

                    <div className="text-sm text-gray-500">
                        {user.role}
                    </div>

                </div>

            </div>

        </div>
    );
}