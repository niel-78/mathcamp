/**
     * Kontrollerar om handeln i en tävling är öppen just nu
     * @param {Object} comp - Tävlingsobjektet från databasen
     * @returns {boolean} - true om handeln är öppen, annars false
     */
    export function isCompetitionOpen(comp) {
    if (!comp) return false;

    const now = new Date();

    // 1. Manuell styrning (Läraren trycker på knappen)
    if (comp.schedule_type === "manual") {
        return Boolean(comp.is_open);
    }

    // 2. Engångsperiod (t.ex. 1 okt - 15 nov)
    if (comp.schedule_type === "single") {
        if (!comp.start_date || !comp.end_date) return false;
        return new Date(comp.start_date) <= now && new Date(comp.end_date) >= now;
    }

    // 3. Återkommande schema
    if (comp.schedule_type === "recurring") {
        const currentDay = now.getDay(); // 0 = Söndag, 1 = Måndag... 6 = Lördag
        const currentDate = now.getDate(); // 1 - 31
        const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"

        // Helgstängt för veckointervall (måndag-fredag tillåtet)
        if (comp.recur_interval === "weekly" && (currentDay === 0 || currentDay === 6)) {
        return false;
        }

        // Exempel: Månadsintervall (tillåtet 1:a till 15:e)
        if (comp.recur_interval === "monthly" && currentDate > 15) {
        return false;
        }

        // Kontrollera klockslag
        const startTime = comp.recur_start_time?.substring(0, 5);
        const endTime = comp.recur_end_time?.substring(0, 5);

        if (startTime && endTime) {
        return currentTimeStr >= startTime && currentTimeStr <= endTime;
        }
    }

    return false;
    }