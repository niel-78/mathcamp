import { defineConfig } from "vite";
import path from "path";
import { execFileSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function getGitVersion() {
    try {
        return execFileSync(
            "git",
            ["rev-parse", "--short=8", "HEAD"],
            {
                cwd: path.resolve(__dirname, ".."),
                encoding: "utf8"
            }
        ).trim();
    } catch {
        return "development";
    }
}

export default defineConfig({
    define: {
        "import.meta.env.VITE_APP_VERSION": JSON.stringify(getGitVersion())
    },

    plugins: [
        react(),
        tailwindcss()
    ],

    resolve: {
        alias: {
            "@": path.resolve(
                __dirname,
                "./src"
            )
        }
    },

    server: {
        port: 5173,
        strictPort: true
    }
});