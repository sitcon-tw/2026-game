import AppShell from "@/components/layout/(player)/AppShell";

export default function PlayerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return <AppShell>{children}</AppShell>;
}
