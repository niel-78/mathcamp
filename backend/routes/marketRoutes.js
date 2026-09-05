// routes/market.js
import express from "express";
import YahooFinance from "yahoo-finance2";

const router = express.Router();
const yahoo = new YahooFinance();

// Mock/Standard-lista för vanliga svenska aktier & fonder om man vill ha snabbval
const POPULAR_ASSETS = [
    { ticker: "INVE-B.ST", name: "Investor B", type: "stock", price: 285.50, change: 1.2 },
    { ticker: "VOLV-B.ST", name: "Volvo B", type: "stock", price: 272.10, change: -0.8 },
    { ticker: "SEB-A.ST", name: "SEB A", type: "stock", price: 148.30, change: 0.4 },
    { ticker: "ERIC-B.ST", name: "Ericsson B", type: "stock", price: 78.90, change: 2.1 },
    { ticker: "SWED-A.ST", name: "Swedbank A", type: "stock", price: 215.00, change: -0.3 },
    { ticker: "AVAN.ST", name: "Avanza Bank", type: "stock", price: 240.20, change: 1.8 },
    { ticker: "0P00000X87.ST", name: "Spiltan Aktiefond Investmentbolag", type: "fund", price: 610.40, change: 0.6 },
    { ticker: "0P00000L89.ST", name: "Länsförsäkringar Global Index", type: "fund", price: 412.10, change: 0.9 },
    { ticker: "0P0000A1A2.ST", name: "Avanza Zero", type: "fund", price: 340.80, change: 0.1 },
];

// GET /api/market/search?q=investor&type=stock
router.get("/search", async (req, res) => {
    const query = (req.query.q || "").toLowerCase();
    const typeFilter = req.query.type; // 'stock' | 'fund' | undefined

    try {
        let results = POPULAR_ASSETS;

        if (query) {
            results = results.filter(
                (item) =>
                    item.name.toLowerCase().includes(query) ||
                    item.ticker.toLowerCase().includes(query)
            );
        }

        if (typeFilter && typeFilter !== "all") {
            results = results.filter((item) => item.type === typeFilter);
        }

        res.json(results);
    } catch (err) {
        console.error("Fel vid marknadssökning:", err);
        res.status(500).send("Kunde inte hämta marknadsdata");
    }
});

export default router;