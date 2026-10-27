import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { AnnouncementList } from "@/components/sections/AnnouncementList";
import { listAnnouncements } from "@/server/services/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Announcements",
  description: "Official recruitment notices with opening and closing dates.",
};

export default async function AnnouncementsPage() {
  const now = new Date();
  const announcements = await listAnnouncements(now);
  return (
    <>
      <PageHeader
        title="Announcements"
        lede="Official recruitment notices. Only notices published here are genuine."
        crumbs={[{ href: "/announcements", label: "Announcements" }]}
      />
      <Container className="py-16 md:py-20">
        <AnnouncementList announcements={announcements} now={now} />
      </Container>
    </>
  );
}
