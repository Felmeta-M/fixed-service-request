import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TTDetail, TTActivity, LocalTroubleTicket } from '@/types/tt';
import { Calendar, MapPin, Phone, User, FileText, Clock, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';
import { useExternalTTDetail, useLocalTT } from '@/features/complaints/hooks/use-complaints';
import { useConfirmFeedback } from '@/hooks/use-api-mutations';
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers';

interface ShowProps {
  ttNumber: string;
}

/**
 * StatusBadge - displays backend status directly without transformation
 * Backend is the source of truth; status may change via third-party integration
 */
const StatusBadge = ({ status }: { status: string }) => {
  const displayStatus = status || 'N/A';
  const lowerStatus = displayStatus.toLowerCase();
  
  // Color coding based on status category patterns
  let colorClass = '';
  
  if (lowerStatus.includes('pending') || lowerStatus.includes('waiting')) {
    colorClass = 'text-yellow-700 border-yellow-200 bg-yellow-50';
  } else if (lowerStatus.includes('progress') || lowerStatus.includes('active') || lowerStatus.includes('processing')) {
    colorClass = 'text-blue-700 border-blue-200 bg-blue-50';
  } else if (lowerStatus.includes('resolved') || lowerStatus.includes('completed') || lowerStatus.includes('success')) {
    colorClass = 'text-green-700 border-green-200 bg-green-50';
  } else if (lowerStatus.includes('closed') || lowerStatus.includes('done')) {
    colorClass = 'text-gray-700 border-gray-200 bg-gray-50';
  } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('failed') || lowerStatus.includes('rejected')) {
    colorClass = 'text-red-700 border-red-200 bg-red-50';
  }
  
  // Display actual backend status (formatted for readability)
  const formattedStatus = displayStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return <Badge variant="outline" className={colorClass}>{formattedStatus}</Badge>;
};

// Helper function to transform LocalTroubleTicket to TTDetail format
const transformLocalToTTDetail = (localTT: LocalTroubleTicket): TTDetail & { 
  serviceOwnerCode?: string;
  serviceOwnerName?: string;
  serviceOwnerType?: string;
  serviceOwnerLevel?: string;
  createdByCode?: string;
  localStatus?: string;
} => {
  // Map status to result_code format (external uses '0' for active, '1' for closed/resolved)
  const isCompleted = ['resolved', 'closed', 'cancelled'].includes(localTT.status);
  const resultCode = isCompleted ? '1' : '0';
  
  // Parse service owner name into parts
  const ownerNameParts = (localTT.service_owner_name || '').trim().split(/\s+/);
  const firstName = ownerNameParts[0] || '';
  const middleName = ownerNameParts.length > 2 ? ownerNameParts.slice(1, -1).join(' ') : '';
  const lastName = ownerNameParts.length > 1 ? ownerNameParts[ownerNameParts.length - 1] : '';
  
  return {
    ttNumber: localTT.tt_serial_no,
    title: '',
    firstName,
    middleName,
    lastName,
    customerType: localTT.service_owner_type || '',
    customerLevel: localTT.service_owner_level || '',
    customerCategory: '',
    custSubCategory: '',
    custID: localTT.service_owner_code || '',
    subsID: '',
    adminRegion: localTT.region || '',
    zone: localTT.zone || '',
    city: localTT.city || '',
    subCity: localTT.sub_city || '',
    wereda: localTT.wereda || '',
    kebele: localTT.kebele || '',
    street: '',
    houseNo: localTT.house_no || '',
    buildingName: '',
    floor: '',
    roomNo: '',
    accessNumber: localTT.access_number || '',
    acctNumber: '',
    additionalFaultyNbr: '',
    contactPerson: localTT.contact_person || '',
    mobileNo: localTT.mobile_no || '',
    telephoneNo: '',
    email: '',
    troubleTitle: localTT.trouble_title || '',
    troubleReason: localTT.trouble_reason || '',
    troubleGrand: '',
    deadline: '',
    acceptTime: localTT.created_at || '',
    occurrenceDate: localTT.created_at || '',
    expectFeedbackTime: '',
    faultLocation: '',
    sendSMS: '',
    ttDescription: localTT.tt_description || '',
    Remark: '',
    attachment: '',
    result_code: resultCode,
    desc: '',
    activities: [],
    // Additional local fields for display
    serviceOwnerCode: localTT.service_owner_code,
    serviceOwnerName: localTT.service_owner_name,
    serviceOwnerType: localTT.service_owner_type,
    serviceOwnerLevel: localTT.service_owner_level,
    createdByCode: localTT.customer_code,
    localStatus: localTT.status,
  };
};

export default function ComplaintsShow({ ttNumber }: ShowProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackDesc, setFeedbackDesc] = useState('');
  // const [confirming, setConfirming] = useState(false);
  const [resultCode, setResultCode] = useState<'0' | '1'>('0');

  // Query external TT first
  const externalQuery = useExternalTTDetail(ttNumber);
  // Query local TT as fallback
  const localQuery = useLocalTT(ttNumber);

  // Determine which source to use
  const source = externalQuery.data?.success && externalQuery.data.data ? 'external' : 'local';
  const loading = externalQuery.isLoading || localQuery.isLoading;

  // Get detail from the appropriate source
  const detail: TTDetail | null = (() => {
    if (externalQuery.data?.success && externalQuery.data.data) {
      return externalQuery.data.data;
    }
    if (localQuery.data?.success && localQuery.data.data) {
      return transformLocalToTTDetail(localQuery.data.data);
    }
    return null;
  })();

  // Handle errors
  useEffect(() => {
    if (externalQuery.error && localQuery.error) {
      const error = localQuery.error;
      if ((error as any).status !== 404) {
        showErrorToast(error.message || 'Failed to load TT details');
      } else {
        showErrorToast('Trouble ticket not found');
      }
    }
  }, [externalQuery.error, localQuery.error]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '?' || dateString === '') return 'N/A';
    try {
      // Handle different date formats
      if (dateString.length === 14 && /^\d+$/.test(dateString)) {
        // Format: YYYYMMDDHHmmss
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const hour = dateString.substring(8, 10);
        const minute = dateString.substring(10, 12);
        const second = dateString.substring(12, 14);
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
      }
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const confirmFeedbackMutation = useConfirmFeedback();

  const handleConfirmFeedback = () => {
    if (!detail?.ttNumber) {
      showErrorToast('TT number is required');
      return;
    }

    if (!feedbackDesc.trim()) {
      showErrorToast('Please provide feedback description');
      return;
    }

    confirmFeedbackMutation.mutate(
      {
        tt_no: detail.ttNumber,
        result_code: resultCode,
        desc: feedbackDesc,
      },
      {
        onSuccess: () => {
          showSuccessToast('Feedback confirmed successfully');
          setShowFeedbackForm(false);
          setFeedbackDesc('');
          // Refetch both queries to get updated data
          externalQuery.refetch();
          localQuery.refetch();
        },
        onError: (error: Error) => {
          showErrorToast(error.message || 'Failed to confirm feedback');
        },
      }
    );
  };

  const confirming = confirmFeedbackMutation.isPending;

  // Only show feedback form for external tickets
  const canConfirmFeedback = source === 'external' && detail?.result_code === '0';

  return (
    <MainLayout>
      <div className="w-full space-y-4 px-4 py-2 lg:px-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.visit('/complaints')}
            className="flex items-center gap-1 w-fit h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">Ticket Details</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Trouble Ticket: {ttNumber}</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading details...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : detail ? (
          <div className="space-y-4">
            {/* Header Card with Status */}
            <Card className='border-none shadow-xs'>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{detail.troubleTitle || 'N/A'}</CardTitle>
                    <CardDescription>
                      {detail.troubleReason || 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {source === 'local' ? (
                      <StatusBadge status={(detail as any).localStatus} />
                    ) : (
                      <Badge variant={detail.result_code === '0' ? 'default' : 'destructive'}>
                        {detail.result_code === '0' ? 'Active' : 'Closed'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {source === 'local' ? 'Local' : 'External'}
                    </Badge>
                    {canConfirmFeedback && !showFeedbackForm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFeedbackForm(true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Feedback Confirmation Form */}
            {showFeedbackForm && (
              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="text-lg">Confirm Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={resultCode === '0' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResultCode('0')}
                        disabled={confirming}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolved
                      </Button>
                      <Button
                        variant={resultCode === '1' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setResultCode('1')}
                        disabled={confirming}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Not Resolved
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Enter your feedback description..."
                      value={feedbackDesc}
                      onChange={(e) => setFeedbackDesc(e.target.value)}
                      rows={3}
                      disabled={confirming}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowFeedbackForm(false);
                          setFeedbackDesc('');
                        }}
                        disabled={confirming}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmFeedback}
                        disabled={confirming || !feedbackDesc.trim()}
                      >
                        {confirming ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Owner Information */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Service Owner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="font-medium">
                      {[detail.title, detail.firstName, detail.middleName, detail.lastName]
                        .filter(Boolean)
                        .join(' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Customer Code</label>
                    <p className="font-medium">{detail.custID || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Customer Type</label>
                      <p className="font-medium">
                        {detail.customerType === '0' ? 'Personal' : 
                         detail.customerType === '1' ? 'Enterprise' : 
                         detail.customerType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Level</label>
                      <p className="font-medium">{detail.customerLevel || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Contact Person</label>
                    <p className="font-medium">{detail.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Mobile</label>
                    <p className="font-medium">{detail.mobileNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{detail.email && detail.email !== '?' ? detail.email : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Access Number</label>
                    <p className="font-medium">{detail.accessNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Account Number</label>
                    <p className="font-medium">{detail.acctNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Subscriber ID</label>
                    <p className="font-medium">{detail.subsID || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Service Location */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Service Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Region</label>
                      <p className="font-medium">{detail.adminRegion || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Zone</label>
                      <p className="font-medium">{detail.zone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground">City</label>
                      <p className="font-medium">{detail.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Sub City</label>
                      <p className="font-medium">{detail.subCity || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Wereda</label>
                      <p className="font-medium">{detail.wereda || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Kebele</label>
                      <p className="font-medium">{detail.kebele || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">House No.</label>
                    <p className="font-medium">{detail.houseNo || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Accept Time</label>
                    <p className="font-medium">{formatDate(detail.acceptTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Occurrence Date</label>
                    <p className="font-medium">{formatDate(detail.occurrenceDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Deadline</label>
                    <p className="font-medium">{formatDate(detail.deadline)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Issue Description */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Issue Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="font-medium whitespace-pre-wrap">{detail.ttDescription || 'N/A'}</p>
                  </div>
                  {detail.Remark && detail.Remark !== '?' && (
                    <div>
                      <label className="text-sm text-muted-foreground">Remark</label>
                      <p className="font-medium whitespace-pre-wrap">{detail.Remark}</p>
                    </div>
                  )}
                  {detail.sendSMS && detail.sendSMS !== '?' && (
                    <div>
                      <label className="text-sm text-muted-foreground">SMS Notification</label>
                      <p className="font-medium">{detail.sendSMS === 'Yes' ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activities Section */}
            {detail.activities && Array.isArray(detail.activities) && detail.activities.length > 0 && (
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {detail.activities.map((activity: TTActivity, index: number) => (
                      <div key={index} className="border-l-2 border-primary pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{activity.activity_name || 'N/A'}</p>
                            {activity.remarks && (
                              <p className="text-sm text-muted-foreground mt-1">{activity.remarks}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {activity.handler && (
                                <span>Handler: {activity.handler}</span>
                              )}
                              {activity.tt_status && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.tt_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {activity.in_time && activity.in_time !== '?' && (
                            <span>In: {formatDate(activity.in_time)}</span>
                          )}
                          {activity.out_time && activity.out_time !== '?' && (
                            <span>Out: {formatDate(activity.out_time)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className='border-none shadow-xs'>
            <CardContent className="py-12 text-center text-muted-foreground">
              No details available
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

