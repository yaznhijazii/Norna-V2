import { QuranViewer } from '../components/QuranViewer';

interface QuranPageProps {
    initialSurah?: string | null;
}

export function QuranPage({ initialSurah }: QuranPageProps) {
    return (
        <div className="pb-32 pt-4 px-2 sm:px-4 max-w-3xl mx-auto">
            <QuranViewer />
        </div>
    );
}
