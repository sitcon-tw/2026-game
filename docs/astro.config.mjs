// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "SITCON 2026 大地遊戲說明文件",
			social: [{ icon: "github", label: "GitHub", href: "https://github.com/sitcon-tw/2026-game" }],
			sidebar: [
				{
					label: "Guides",
					items: [
						{ label: "Example Guide", slug: "guides/example" }
					]
				},
				{
					label: "Reference",
					autogenerate: { directory: "reference" }
				}
			]
		})
	]
});
