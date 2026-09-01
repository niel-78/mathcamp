import fs from "fs";
import db from "../db.js";
import importQuestionsToBlock from "../helpers/importQuestionsToBlock.js";

const mapping = [
    { blockId: 28, file: "/app/examples/rakneordning_skolig_3_nivaer.xlsx" },
    { blockId: 29, file: "/app/examples/rakneordning_negativa_tal_3_nivaer.xlsx" },
    { blockId: 30, file: "/app/examples/rakneordning_negativa_tal_3_nivaer.xlsx" },
    { blockId: 31, file: "/app/examples/brakform_4_rakn_3_nivaer.xlsx" },
    { blockId: 32, file: "/app/examples/rakneordning_negativa_tal_3_nivaer.xlsx" },
    { blockId: 33, file: "/app/examples/rakneordning_skolig_3_nivaer.xlsx" },
    { blockId: 34, file: "/app/examples/distributiv_lag_och_förenkling_3_nivaer.xlsx" }
];

async function run() {

    console.log("Connecting to database...");

    for (const { blockId, file } of mapping) {

        const [deleteResult] =
            await db.query(
                `DELETE FROM questions WHERE block_id = ? AND series_level_id IS NULL`,
                [blockId]
            );

        console.log(
            `Block ${blockId}: deleted ${deleteResult.affectedRows} old questions`
        );

        const fileBuffer = fs.readFileSync(file);

        const result = await importQuestionsToBlock({
            blockId,
            fileBuffer,
            userId: 1
        });

        console.log(
            `Block ${blockId}: imported ${result?.importedCount ?? "?"} questions from ${file}`
        );

    }

    console.log("Done.");
    process.exit(0);

}

run().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});
