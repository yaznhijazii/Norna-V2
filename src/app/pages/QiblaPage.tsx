import { QiblaFullView } from '../components/QiblaFullView';

interface QiblaPageProps {
    onBack: () => void;
}

export function QiblaPage({ onBack }: QiblaPageProps) {
    return (
        <QiblaFullView
            isOpen={true}
            onClose={onBack}
        />
    );
}
