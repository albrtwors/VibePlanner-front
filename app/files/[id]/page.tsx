// app/songs/[id]/page.tsx
import FileDetailPage from "@/components/pages/files/detail/page";
import SongDetailPage from "@/components/pages/songs/detail/page";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    return <FileDetailPage params={params}></FileDetailPage>
}