import { FileText } from 'lucide-react';
import { useState } from 'react';
import SurveyCard from './survey-card';

interface SurveyTableProps {
    surveys: any[];
    onSurveyUpdate: () => void;
    loading?: boolean;
}

export default function SurveyTable({ surveys, onSurveyUpdate, loading }: SurveyTableProps) {
    const [updatingSurvey, setUpdatingSurvey] = useState<string | null>(null);

    if (!surveys || surveys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                <FileText className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-500">No surveys found</h3>
                <p className="max-w-sm text-gray-400">{loading ? 'Loading your surveys...' : 'Get started by creating your first survey request'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
                {surveys.map((survey) => (
                    <SurveyCard
                        key={survey.customer_survey_order_id}
                        survey={survey}
                        onUpdate={onSurveyUpdate}
                        updating={updatingSurvey === survey.customer_survey_order_id}
                        onUpdatingChange={(updating) => setUpdatingSurvey(updating ? survey.customer_survey_order_id : null)}
                    />
                ))}
            </div>

            {/* Load More could be implemented here for pagination */}
        </div>
    );
}
