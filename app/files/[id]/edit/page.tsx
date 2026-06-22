// app/songs/[id]/page.tsx

import EditFilePage from "@/components/pages/files/edit/page";
import EditSongPageClient from "@/components/pages/songs/edit/page";


interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    return <EditFilePage params={params}></EditFilePage>
}