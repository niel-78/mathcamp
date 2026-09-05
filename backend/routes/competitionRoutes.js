import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Skydda alla rutter med autentisering
router.use(requireAuth);

/**
 * GET /api/competitions/student/my-competitions
 * Hämtar den inloggade elevens grupper och tillgängliga tävlingar
 */
router.get("/student/my-competitions", async (req, res) => {

    const userId = req.user?.id;
    const groupId = req.query.groupId
        ? Number(req.query.groupId)
        : null;

    if (req.user?.role !== "student") {
        return res.status(403).send("Access denied");
    }

    if (
        req.query.groupId &&
        !Number.isInteger(groupId)
    ) {
        return res.status(400).send("Ogiltigt grupp-id");
    }

    try {

        const [groups] = await db.query(
            `
            SELECT
                g.id,
                g.name
            FROM group_students gs
            INNER JOIN \`groups\` g
                ON g.id = gs.group_id
            WHERE gs.user_id = ?
                AND gs.deleted_at IS NULL
                AND g.archived_at IS NULL
                AND g.deleted_at IS NULL
                AND (? IS NULL OR g.id = ?)
            ORDER BY
                gs.joined_at DESC,
                g.name
            `,
            [
                userId,
                groupId,
                groupId
            ]
        );

        const result = [];

        for (const group of groups) {

            const [competitions] = await db.query(
                `
                SELECT
                    id,
                    title,
                    description,
                    start_date,
                    end_date,
                    starting_budget,
                    is_open,
                    schedule_type
                FROM competitions
                WHERE group_id = ?
                    AND (
                        is_open = 1
                        OR (
                            schedule_type = 'scheduled'
                            AND start_date <= NOW()
                            AND end_date >= NOW()
                        )
                    )
                ORDER BY created_at DESC
                `,
                [group.id]
            );

            result.push({
                group_id: group.id,
                group_name: group.name,
                competitions
            });

        }

        res.json(result);

    } catch (error) {

        console.error("Fel vid hämtning av elevens tävlingar:", error);
        res.status(500).send("Kunde inte hämta dina tävlingar");

    }

});

/**
 * GET /api/competitions/group/:groupId
 * Hämtar alla tävlingar för en specifik grupp
 */
router.get("/group/:groupId", async (req, res) => {
    const { groupId } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM competitions WHERE group_id = ? ORDER BY created_at DESC",
            [groupId]
        );

        res.json(rows);
    } catch (error) {
        console.error("Fel vid hämtning av tävlingar:", error);
        res.status(500).send("Kunde inte hämta tävlingar för gruppen");
    }
});

/**
 * GET /api/competitions/:id
 * Hämtar detaljer för en specifik tävling + deltagare, innehav och topplista
 */
router.get("/:id", async (req, res) => {
    const competitionId = req.params.id;
    const userId = req.user?.id;

    try {
        const [compRows] = await db.query(
            "SELECT * FROM competitions WHERE id = ?",
            [competitionId]
        );

        if (compRows.length === 0) {
            return res.status(404).send("Tävlingen hittades inte");
        }

        const competition = compRows[0];

        // 1. Kontrollera om användaren är deltagare
        const [partRows] = await db.query(
            "SELECT id FROM competition_participants WHERE competition_id = ? AND student_id = ?",
            [competitionId, userId]
        );
        competition.is_participant = partRows.length > 0;

        // 2. Hämta alla deltagare till topplistan och märk ut den inloggade
        const [participants] = await db.query(
            `SELECT cp.*, u.first_name, u.last_name, 
             (cp.student_id = ?) AS is_participant
             FROM competition_participants cp
             JOIN users u ON cp.student_id = u.id
             WHERE cp.competition_id = ?
             ORDER BY cp.cash_balance DESC`,
            [userId, competitionId]
        );

        // 3. Hämta innehav för varje deltagare baserat på genomförda affärer
        for (let participant of participants) {
            const [trades] = await db.query(
                `SELECT ticker, type, shares, price 
                 FROM competition_trades 
                 WHERE participant_id = ?`,
                [participant.id]
            );

            const holdingsMap = {};
            for (let trade of trades) {
                if (!holdingsMap[trade.ticker]) {
                    holdingsMap[trade.ticker] = { ticker: trade.ticker, shares: 0, totalCost: 0 };
                }
                if (trade.type === "BUY") {
                    holdingsMap[trade.ticker].shares += Number(trade.shares);
                    holdingsMap[trade.ticker].totalCost += Number(trade.shares) * Number(trade.price);
                } else if (trade.type === "SELL") {
                    holdingsMap[trade.ticker].shares -= Number(trade.shares);
                }
            }

            participant.holdings = Object.values(holdingsMap)
                .filter(h => h.shares > 0)
                .map(h => ({
                    ticker: h.ticker,
                    shares: h.shares,
                    avg_price: h.shares > 0 ? h.totalCost / h.shares : 0,
                    current_price: h.price 
                }));
        }

        competition.participants = participants;

        res.json(competition);
    } catch (error) {
        console.error("Fel vid hämtning av tävling:", error);
        res.status(500).send("Kunde inte hämta tävlingsdata");
    }
});

/**
 * POST /api/competitions
 * Skapar en ny tävling för en grupp
 */
router.post("/", async (req, res) => {
    const {
        groupId,
        title,
        description,
        startDate,
        endDate,
        startingBudget,
        maxStockWeight,
        tradingFee,
        scheduleType,
        recurInterval,
        recurStartTime,
        recurEndTime,
        isOpen,
        requireReasoning
    } = req.body;

    if (!groupId || !title) {
        return res.status(400).send("Obligatoriska fält saknas (Titel eller Grupp-ID saknas)");
    }

    if (scheduleType === "single" && (!startDate || !endDate)) {
        return res.status(400).send("Start- och slutdatum krävs för engångsperiod");
    }

    try {
        const [result] = await db.query(
            `INSERT INTO competitions 
                (group_id, title, description, start_date, end_date, starting_budget, max_stock_weight, trading_fee, schedule_type, recur_interval, recur_start_time, recur_end_time, is_open, require_reasoning) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                groupId,
                title,
                description || null,
                startDate || null,
                endDate || null,
                startingBudget ?? 100000.0,
                maxStockWeight ?? 0.20,
                tradingFee ?? 0.00,
                scheduleType || "single",
                recurInterval || null,
                recurStartTime || null,
                recurEndTime || null,
                isOpen ? 1 : 0,
                requireReasoning ? 1 : 0
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: "Tävlingen skapades framgångsrikt"
        });
    } catch (error) {
        console.error("Fel vid skapande av tävling:", error);
        res.status(500).send("Kunde inte skapa tävlingen i databasen");
    }
});

/**
 * PATCH /api/competitions/:id/toggle-open
 * Växlar manuellt om handeln är öppen eller stängd
 */
router.patch("/:id/toggle-open", async (req, res) => {
    const { id } = req.params;
    const { isOpen } = req.body;

    try {
        await db.query(
            "UPDATE competitions SET is_open = ? WHERE id = ?",
            [isOpen ? 1 : 0, id]
        );

        res.json({ message: "Status uppdaterad" });
    } catch (error) {
        console.error("Fel vid uppdatering av status:", error);
        res.status(500).send("Kunde inte uppdatera status");
    }
});

/**
 * POST /api/competitions/:id/join
 * Gå med i en tävling som deltagare
 */
router.post("/:id/join", async (req, res) => {
    const competitionId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const [compRows] = await db.query(
            "SELECT starting_budget FROM competitions WHERE id = ?",
            [competitionId]
        );

        if (compRows.length === 0) {
            return res.status(404).send("Tävlingen hittades inte");
        }

        const startingBudget = compRows[0].starting_budget;
        const isTeacher = userRole === "teacher" || userRole === "admin" ? 1 : 0;

        await db.query(
            `INSERT INTO competition_participants 
                (competition_id, student_id, cash_balance, is_teacher) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id=id`,
            [competitionId, userId, startingBudget, isTeacher]
        );

        res.json({ message: "Du är nu med i tävlingen!" });
    } catch (error) {
        console.error("Fel vid anslutning till tävling:", error);
        res.status(500).send("Kunde inte gå med i tävlingen");
    }
});

/**
 * POST /api/competitions/:id/trade
 * Genomför ett köp eller en försäljning
 */
router.post("/:id/trade", async (req, res) => {
    const competitionId = req.params.id;
    const userId = req.user?.id;
    const { ticker, type, shares, price, reasoning } = req.body;

    if (!ticker || !type || !shares || !price || Number(shares) <= 0 || Number(price) <= 0) {
        return res.status(400).send("Ogiltiga handelsuppgifter (aktie, antal eller pris saknas/är ogiltigt)");
    }

    try {
        const [compRows] = await db.query(
            "SELECT * FROM competitions WHERE id = ?",
            [competitionId]
        );

        if (compRows.length === 0) {
            return res.status(404).send("Tävlingen hittades inte");
        }

        const comp = compRows[0];

        if (comp.require_reasoning && (!reasoning || reasoning.trim() === "")) {
            return res.status(400).send("Motivering krävs för att genomföra affären");
        }

        const [partRows] = await db.query(
            "SELECT * FROM competition_participants WHERE competition_id = ? AND student_id = ?",
            [competitionId, userId]
        );

        if (partRows.length === 0) {
            return res.status(403).send("Du är inte med i tävlingen");
        }

        const participant = partRows[0];
        const tradeAmount = Number(shares) * Number(price);
        const fee = Number(comp.trading_fee ?? 0);

        if (type === "BUY") {
            const totalCost = tradeAmount + fee;

            if (Number(participant.cash_balance) < totalCost) {
                return res.status(400).send("Otillräckligt likvida medel (inklusive courtage)");
            }

            const maxAllowed = Number(comp.starting_budget) * Number(comp.max_stock_weight);
            if (tradeAmount > maxAllowed) {
                return res.status(400).send(`Du får max köpa för ${maxAllowed.toLocaleString("sv-SE")} kr i en enskild aktie.`);
            }

            await db.query(
                "UPDATE competition_participants SET cash_balance = cash_balance - ? WHERE id = ?",
                [totalCost, participant.id]
            );

        } else if (type === "SELL") {
            const netIncome = tradeAmount - fee;

            if (netIncome < 0) {
                return res.status(400).send("Försäljningsbeloppet täcker inte courtaget");
            }

            await db.query(
                "UPDATE competition_participants SET cash_balance = cash_balance + ? WHERE id = ?",
                [netIncome, participant.id]
            );
        } else {
            return res.status(400).send("Ogiltig transaktionstyp (måste vara BUY eller SELL)");
        }

        await db.query(
            `INSERT INTO competition_trades 
                (participant_id, ticker, type, shares, price, fee, reasoning) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [participant.id, ticker, type, shares, price, fee, reasoning || null]
        );

        res.json({ message: "Handeln genomförd!" });
    } catch (err) {
        console.error("EXAKT HANDELSFEL:", err.message);
        res.status(500).send(`Internt serverfel: ${err.message}`);
    }
});

export default router;