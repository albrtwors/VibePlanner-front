// app/songs/[id]/page.tsx
import SongDetailPage from "@/components/pages/songs/detail/page";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    return <SongDetailPage params={params} />;
}