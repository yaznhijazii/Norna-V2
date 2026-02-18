import { QuranViewer } from '../components/QuranViewer';

interface QuranPageProps {
    initialSurah?: string | null;
    jumpToBookmark?: boolean;
    onJumped?: () => void;
}

export function QuranPage({ initialSurah, jumpToBookmark, onJumped }: QuranPageProps) {
    return (
        <div className="pb-32 pt-4 px-2 sm:px-4 max-w-3xl mx-auto">
            <QuranViewer jumpToBookmark={jumpToBookmark} onJumped={onJumped} />
        </div>
    );
}
