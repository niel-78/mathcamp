export async function getGroupPermission(
    groupId,
    teacherId
) {

    const [[permission]] =
        await db.query(
            `
            SELECT role
            FROM group_permissions
            WHERE group_id = ?
            AND user_id = ?
            `,
            [
                groupId,
                teacherId
            ]
        );

    return permission?.role ?? null;

}