// app/songs/[id]/page.tsx

import EditSongPageClient from "@/components/pages/songs/edit/page";


interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    return <EditSongPageClient params={params}></EditSongPageClient>
}