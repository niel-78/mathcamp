import UserProfile from "@/components/ui/UserProfile";
import Calculator from "@/components/ui/Calculator";

export default function Header() {
    return (
        <header className="min-h-16 border-b px-6 flex items-center justify-between gap-4">
            <UserProfile />
            <Calculator />
        </header>
    );
}