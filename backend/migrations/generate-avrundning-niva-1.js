import { writeFileSync } from "node:fs";
import XLSX from "xlsx";

const outputPath = new URL(
    "../../examples/avrundning_niva_1_numeric_input.csv",
    import.meta.url
).pathname;

const questions = [
    ["Avrunda 27 400 till tusental.", "27000"],
    ["Avrunda 34 600 till tusental.", "35000"],
    ["Avrunda 12 400 till tusental.", "12000"],
    ["Avrunda 8 500 till tusental.", "9000"],
    ["Avrunda 41 200 till tusental.", "41000"],
    ["Avrunda 76 800 till tusental.", "77000"],
    ["Avrunda 19 500 till tusental.", "20000"],
    ["Avrunda 63 300 till tusental.", "63000"],
    ["Avrunda 2 700 till tusental.", "3000"],
    ["Avrunda 95 100 till tusental.", "95000"],
    ["Avrunda 146 till hundratal.", "100"],
    ["Avrunda 278 till hundratal.", "300"],
    ["Avrunda 650 till hundratal.", "700"],
    ["Avrunda 1 249 till hundratal.", "1200"],
    ["Avrunda 3 751 till hundratal.", "3800"],
    ["Avrunda 4 050 till hundratal.", "4100"],
    ["Avrunda 920 till hundratal.", "900"],
    ["Avrunda 5 499 till hundratal.", "5500"],
    ["Avrunda 1 550 till hundratal.", "1600"],
    ["Avrunda 87 till hundratal.", "100"],
    ["Avrunda 43 till tiotal.", "40"],
    ["Avrunda 68 till tiotal.", "70"],
    ["Avrunda 125 till tiotal.", "130"],
    ["Avrunda 391 till tiotal.", "390"],
    ["Avrunda 706 till tiotal.", "710"],
    ["Avrunda 1 054 till tiotal.", "1050"],
    ["Avrunda 2 895 till tiotal.", "2900"],
    ["Avrunda 999 till tiotal.", "1000"],
    ["Avrunda 342 till tiotal.", "340"],
    ["Avrunda 1 675 till tiotal.", "1680"],
    ["Avrunda 0,123 till hundradelar.", "0,12"],
    ["Avrunda 0,278 till hundradelar.", "0,28"],
    ["Avrunda 1,456 till hundradelar.", "1,46"],
    ["Avrunda 2,341 till hundradelar.", "2,34"],
    ["Avrunda 5,995 till hundradelar.", "6,00"],
    ["Avrunda 7,205 till hundradelar.", "7,21"],
    ["Avrunda 0,864 till hundradelar.", "0,86"],
    ["Avrunda 12,499 till hundradelar.", "12,50"],
    ["Avrunda 3,150 till hundradelar.", "3,15"],
    ["Avrunda 9,876 till hundradelar.", "9,88"],
    ["Avrunda 0,34 till tiondelar.", "0,3"],
    ["Avrunda 0,68 till tiondelar.", "0,7"],
    ["Avrunda 1,25 till tiondelar.", "1,3"],
    ["Avrunda 2,04 till tiondelar.", "2,0"],
    ["Avrunda 4,96 till tiondelar.", "5,0"],
    ["Avrunda 7,51 till tiondelar.", "7,5"],
    ["Avrunda 10,75 till tiondelar.", "10,8"],
    ["Avrunda 15,14 till tiondelar.", "15,1"],
    ["Avrunda 23,88 till tiondelar.", "23,9"],
    ["Avrunda 99,95 till tiondelar.", "100,0"],
    ["Avrunda 6,47 till en decimal.", "6,5"],
    ["Avrunda 12,34 till en decimal.", "12,3"],
    ["Avrunda 0,85 till en decimal.", "0,9"],
    ["Avrunda 23,05 till en decimal.", "23,1"],
    ["Avrunda 9,99 till en decimal.", "10,0"],
    ["Avrunda 4,276 till två decimaler.", "4,28"],
    ["Avrunda 0,341 till två decimaler.", "0,34"],
    ["Avrunda 8,995 till två decimaler.", "9,00"],
    ["Avrunda 15,105 till två decimaler.", "15,11"],
    ["Avrunda 2,750 till två decimaler.", "2,75"],
    ["Avrunda 3,64 till en decimal.", "3,6"],
    ["Avrunda 7,86 till en decimal.", "7,9"],
    ["Avrunda 14,45 till en decimal.", "14,5"],
    ["Avrunda 0,16 till en decimal.", "0,2"],
    ["Avrunda 25,02 till en decimal.", "25,0"],
    ["Avrunda 18,78 till en decimal.", "18,8"],
    ["Avrunda 2,51 till en decimal.", "2,5"],
    ["Avrunda 40,66 till en decimal.", "40,7"],
    ["Avrunda 0,94 till en decimal.", "0,9"],
    ["Avrunda 11,15 till en decimal.", "11,2"],
    ["Avrunda 6,04 till en decimal.", "6,0"],
    ["Avrunda 32,39 till en decimal.", "32,4"],
    ["Avrunda 0,55 till en decimal.", "0,6"],
    ["Avrunda 19,97 till en decimal.", "20,0"],
    ["Avrunda 45,23 till en decimal.", "45,2"],
    ["Avrunda 3,141 till två decimaler.", "3,14"],
    ["Avrunda 6,789 till två decimaler.", "6,79"],
    ["Avrunda 0,675 till två decimaler.", "0,68"],
    ["Avrunda 14,232 till två decimaler.", "14,23"],
    ["Avrunda 9,999 till två decimaler.", "10,00"],
    ["Avrunda 21,056 till två decimaler.", "21,06"],
    ["Avrunda 0,124 till två decimaler.", "0,12"],
    ["Avrunda 5,555 till två decimaler.", "5,56"],
    ["Avrunda 17,801 till två decimaler.", "17,80"],
    ["Avrunda 2,345 till två decimaler.", "2,35"],
    ["Avrunda 30,494 till två decimaler.", "30,49"],
    ["Avrunda 0,905 till två decimaler.", "0,91"],
    ["Avrunda 12,999 till två decimaler.", "13,00"],
    ["Avrunda 7,070 till två decimaler.", "7,07"],
    ["Avrunda 99,445 till två decimaler.", "99,45"]
];

function roundedAnswer(question) {
    const match = /Avrunda ([\d ]+)(?:,(\d+))? till (tiotal|hundratal|tusental|tiondelar|hundradelar|en decimal|två decimaler)/.exec(question);

    if (!match) {
        throw new Error(`Kunde inte tolka fråga: ${question}`);
    }

    const targetDecimals = {
        tiotal: -1,
        hundratal: -2,
        tusental: -3,
        tiondelar: 1,
        hundradelar: 2,
        "en decimal": 1,
        "två decimaler": 2
    }[match[3]];
    const decimalDigits = match[2] || "";
    const unrounded = BigInt(`${match[1].replaceAll(" ", "")}${decimalDigits}`);
    const placesToRemove = decimalDigits.length - targetDecimals;
    const divisor = 10n ** BigInt(Math.max(placesToRemove, 0));
    const rounded = placesToRemove > 0
        ? (unrounded + divisor / 2n) / divisor
        : unrounded * (10n ** BigInt(-placesToRemove));
    const digits = rounded.toString().padStart(Math.max(targetDecimals + 1, 1), "0");

    if (targetDecimals <= 0) {
        return `${rounded * (10n ** BigInt(-targetDecimals))}`;
    }

    return `${digits.slice(0, -targetDecimals)},${digits.slice(-targetDecimals)}`;
}

if (questions.length !== 90) {
    throw new Error(`Förväntade 90 frågor, fick ${questions.length}`);
}

for (const [question, answer] of questions) {
    const calculatedAnswer = roundedAnswer(question);
    const [, integerPart, decimalPart = "", target] = /Avrunda ([\d ]+)(?:,(\d+))? till (tiotal|hundratal|tusental|tiondelar|hundradelar|en decimal|två decimaler)/.exec(question) || [];
    const targetDecimals = {
        tiotal: -1,
        hundratal: -2,
        tusental: -3,
        tiondelar: 1,
        hundradelar: 2,
        "en decimal": 1,
        "två decimaler": 2
    }[target];
    const digitsToRemove = decimalPart.length - targetDecimals;

    if (digitsToRemove <= 0) {
        throw new Error(`Frågan saknar siffror att avrunda bort: ${question}`);
    }

    if (calculatedAnswer !== answer) {
        throw new Error(
            `Felaktigt svar för "${question}": ${answer}, förväntat ${calculatedAnswer}`
        );
    }
}

const rows = questions.map(([question, answer]) => ({
    "Fråga": question.replace(
        /Avrunda (\d(?:[\d ]*\d)?(?:,\d+)?)/,
        (_, number) => `Avrunda $${number}$`
    ) + " Svar: {{input}}",
    "Frågetyp": "numeric_input",
    "Nivå": 1,
    "Svar": answer,
    "Miniräknare tillåten": "Nej"
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(workbook, worksheet, "Frågor");
writeFileSync(outputPath, XLSX.utils.sheet_to_csv(worksheet), "utf8");

console.log(`Verifierade och skrev ${rows.length} frågor till ${outputPath}`);