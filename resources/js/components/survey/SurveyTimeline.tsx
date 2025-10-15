import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';

interface SurveyTimelineProps {
    survey: any;
}

export default function SurveyTimeline({ survey }: SurveyTimelineProps) {
    const getTimelineEvents = (survey: any) => {
        const events = [
            {
                id: 1,
                name: 'Survey Created',
                description: 'Survey request was submitted',
                date: survey.created_at,
                status: 'completed',
                icon: FileText,
            },
        ];

        if (survey.updated_at && survey.updated_at !== survey.created_at) {
            events.push({
                id: 2,
                name: 'Survey Updated',
                description: 'Survey details were updated',
                date: survey.updated_at,
                status: 'completed',
                icon: FileText,
            });
        }

        if (survey.scheduled_date) {
            events.push({
                id: 3,
                name: 'Scheduled',
                description: 'Survey was scheduled for site visit',
                date: survey.scheduled_date,
                status: 'completed',
                icon: Clock,
            });
        }

        if (survey.status === 'completed' && survey.completed_date) {
            events.push({
                id: 4,
                name: 'Completed',
                description: 'Survey was completed successfully',
                date: survey.completed_date,
                status: 'completed',
                icon: CheckCircle,
            });
        }

        if (survey.status === 'cancelled') {
            events.push({
                id: 5,
                name: 'Cancelled',
                description: 'Survey was cancelled',
                date: survey.updated_at,
                status: 'cancelled',
                icon: AlertCircle,
            });
        }

        // Sort events by date
        return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const events = getTimelineEvents(survey);

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {events.map((event, eventIdx) => {
                    const Icon = event.icon;
                    return (
                        <li key={event.id}>
                            <div className="relative pb-8">
                                {eventIdx !== events.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                                                event.status === 'completed'
                                                    ? 'bg-green-500'
                                                    : event.status === 'cancelled'
                                                      ? 'bg-red-500'
                                                      : 'bg-gray-400'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{event.name}</p>
                                            <p className="text-sm text-gray-500">{event.description}</p>
                                        </div>
                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                            {new Date(event.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
