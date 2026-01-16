import { AthkarReader } from '../components/AthkarReader';
import { useTimeOfDay } from '../hooks/useTimeOfDay';

interface AzkarPageProps {
    initialType?: 'morning' | 'evening' | 'israa_miraj' | 'sleep' | null;
}

export function AzkarPage({ initialType }: AzkarPageProps) {
    return (
        <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto">
            {/* The header is now handled inside AthkarReader for consistency across all views (Home, Page, etc.) */}
            <AthkarReader initialType={initialType} />
        </div>
    );
}
