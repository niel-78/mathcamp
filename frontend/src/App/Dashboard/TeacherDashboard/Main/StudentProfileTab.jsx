import { Mail, UserRound } from "lucide-react";

export default function StudentProfileTab({ student }) {

    const fullName = [student?.first_name, student?.last_name]
        .filter(Boolean)
        .join(" ") || "-";

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <UserRound className="h-6 w-6 text-slate-500" />
                        <h1 className="text-2xl font-bold">Elev</h1>
                    </div>

                    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-semibold text-slate-500">
                                Namn
                            </dt>
                            <dd className="mt-1">{fullName}</dd>
                        </div>

                        <div>
                            <dt className="text-sm font-semibold text-slate-500">
                                Visningsnamn
                            </dt>
                            <dd className="mt-1">{student?.display_name || "-"}</dd>
                        </div>

                        <div>
                            <dt className="text-sm font-semibold text-slate-500">
                                Användarnamn
                            </dt>
                            <dd className="mt-1">{student?.username || "-"}</dd>
                        </div>

                        <div>
                            <dt className="text-sm font-semibold text-slate-500">
                                Grupp
                            </dt>
                            <dd className="mt-1">{student?.group_name || "-"}</dd>
                        </div>

                        <div>
                            <dt className="flex items-center gap-1 text-sm font-semibold text-slate-500">
                                <Mail className="h-4 w-4" /> Emailadress
                            </dt>
                            <dd className="mt-1">{student?.email || "-"}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}