export default function generatePassword() {

    // Avoid visually ambiguous characters (0/O, 1/I/l)
    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let password = "";

    for (let i = 0; i < 6; i++) {

        password +=
            chars[Math.floor(
                Math.random() * chars.length
            )];

    }

    return password;
}