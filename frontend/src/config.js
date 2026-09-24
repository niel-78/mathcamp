const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = configuredApiUrl
	? configuredApiUrl.replace(/\/$/, "")
	: import.meta.env.DEV
		? `${window.location.protocol}//${window.location.hostname}:3000`
		: "";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "development";