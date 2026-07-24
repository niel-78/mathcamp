export default function generatePassword() {

    const words = [
        "Tiger",
        "Planet",
        "Skola",
        "Banan",
        "Sommar",
        "Vinter",
        "Komet",
        "Fjader",
        "Ocean",
        "Skog"
    ];

    const word =
        words[Math.floor(
            Math.random() * words.length
        )];

    const number =
        Math.floor(
            100 + Math.random() * 900
        );

    return `${word}${number}`;
}