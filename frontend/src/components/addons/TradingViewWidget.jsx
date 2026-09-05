import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol = "AAPL" }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Om containern inte finns ännu, gör ingenting
        if (!containerRef.current) return;

        // Rensa containern helt innan vi lägger till nytt skript
        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: symbol.includes(":") ? symbol : `NASDAQ:${symbol}`,
            interval: "D",
            timezone: "Europe/Stockholm",
            theme: "light",
            style: "1",
            locale: "sv",
            enable_publishing: false,
            allow_symbol_change: true,
            calendar: false,
            support_host: "https://www.tradingview.com"
        });

        containerRef.current.appendChild(script);

        // Cleanup vid unmount
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [symbol]);

    return (
        <div 
            className="tradingview-widget-container" 
            ref={containerRef} 
            style={{ height: "100%", width: "100%", minHeight: "400px" }}
        />
    );
}

export default memo(TradingViewWidget);