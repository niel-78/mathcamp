export function getUserEmail(user) {
    return user.email || user.delivery_email || null;
}

export function serializeAuthUser(user, school = null) {
    return {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        email: getUserEmail(user),
        school
    };
}
