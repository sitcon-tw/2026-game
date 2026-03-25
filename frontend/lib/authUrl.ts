export function scrubTokenFromCurrentUrl() {
	if (typeof window === "undefined") {
		return;
	}

	const url = new URL(window.location.href);
	if (!url.searchParams.has("token")) {
		return;
	}

	url.searchParams.delete("token");
	const nextUrl = `${url.pathname}${url.search}${url.hash}`;
	window.history.replaceState({}, "", nextUrl || url.pathname);
}
