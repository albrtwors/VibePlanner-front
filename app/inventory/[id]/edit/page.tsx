// app/songs/[id]/page.tsx

import EditFilePage from "@/components/pages/files/edit/page";
import EditSongPageClient from "@/components/pages/songs/edit/page";
import EditEventPage from "@/components/pages/events/edit/page";
import EditInventoryPage from "@/components/pages/inventory/edit/page";
interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    return <EditInventoryPage params={params}></EditInventoryPage>
}