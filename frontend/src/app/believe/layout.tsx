import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Statement of Faith — Light Encounter Tabernacle Worldwide",
    description: "What we believe — the convictions on which Light Encounter Tabernacle Worldwide stands.",
};

// Dedicated layout: no navbar, no footer — the cinematic experience floats alone.
export default function BelieveLayout({ children }: { children: React.ReactNode }) {
    return <div className="believe-standalone">{children}</div>;
}
