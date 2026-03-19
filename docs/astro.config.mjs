// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
	base: "/docs",
	output: "static",
	build: {
		format: "directory"
	},
	vite: {
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src")
			}
		}
	},
	integrations: [
		starlight({
			title: "SITCON 2026 大地遊戲說明文件",
			social: [{ icon: "github", label: "GitHub", href: "https://github.com/sitcon-tw/2026-game" }],
			sidebar: [
				{
					label: "會眾",
					autogenerate: { directory: "attendee" }
				},
				{
					label: "攤位",
					autogenerate: { directory: "booth" }
				},
				{
					label: "移動攤位",
					autogenerate: { directory: "mobile-booth" }
				},
				{
					label: "紀念品收銀員",
					autogenerate: { directory: "cashier" }
				},
				{
					label: "管理員",
					autogenerate: { directory: "admin" }
				},
				{
					label: "打卡點",
					autogenerate: { directory: "checkin-point" }
				}
			]
		})
	]
});
