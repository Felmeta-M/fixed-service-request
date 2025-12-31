import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TTDetail, TTActivity, LocalTroubleTicket } from '@/types/tt';
import { Calendar, MapPin, Phone, User, FileText, Clock, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePage, router } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';
import { useExternalTTDetail, useLocalTT } from '@/hooks/use-complaints';
import { useConfirmFeedback } from '@/hooks/use-api-mutations';

interface ShowProps {
  ttNumber: string;
}

// Helper function to transform LocalTroubleTicket to TTDetail format
const transformLocalToTTDetail = (localTT: LocalTroubleTicket): TTDetail => {
  // Map status to result_code format (external uses '0' for active, '1' for failed/closed)
  const resultCode = localTT.status === 'completed' || localTT.status === 'cancelled' ? '1' : '0';
  
  // Split contact person name into parts (simple split on spaces)
  const nameParts = (localTT.contact_person || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  
  return {
    ttNumber: localTT.tt_serial_no,
    title: '',
    firstName,
    middleName,
    lastName,
    customerType: '',
    customerLevel: '',
    customerCategory: '',
    custSubCategory: '',
    custID: '',
    subsID: '',
    adminRegion: '',
    zone: '',
    city: '',
    subCity: '',
    wereda: '',
    kebele: '',
    street: '',
    houseNo: '',
    buildingName: '',
    floor: '',
    roomNo: '',
    accessNumber: localTT.access_number || '',
    acctNumber: localTT.account_number || '',
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
    occurrenceDate: localTT.occurrence_date || '',
    expectFeedbackTime: '',
    faultLocation: '',
    sendSMS: '',
    ttDescription: localTT.tt_description || '',
    Remark: '',
    attachment: '',
    result_code: resultCode,
    desc: '',
    activities: [],
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
        toast.error(error.message || 'Failed to load TT details');
      } else {
        toast.error('Trouble ticket not found');
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
      toast.error('TT number is required');
      return;
    }

    if (!feedbackDesc.trim()) {
      toast.error('Please provide feedback description');
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
          setShowFeedbackForm(false);
          setFeedbackDesc('');
          // Refetch both queries to get updated data
          externalQuery.refetch();
          localQuery.refetch();
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.visit('/complaints')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex flex-row items-center gap-2">
              {/* <h1 className="text-2xl font-bold tracking-tight">TT Details</h1> */}
              <p className="text-muted-foreground">Trouble Ticket: {ttNumber}</p>
            </div>
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
                    <Badge variant={detail.result_code === '0' ? 'default' : source === 'local' && detail.result_code === '1' ? 'secondary' : 'destructive'}>
                      {source === 'local' 
                        ? (detail.result_code === '0' ? 'Active' : detail.result_code === '1' ? 'Completed' : 'Failed')
                        : (detail.result_code === '0' ? 'Active' : 'Failed')
                      }
                    </Badge>
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
              {/* Customer Information */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
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
                    <label className="text-sm text-muted-foreground">Customer Type</label>
                    <p className="font-medium">{detail.customerType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Category</label>
                    <p className="font-medium">
                      {detail.customerCategory || 'N/A'} / {detail.custSubCategory || 'N/A'}
                    </p>
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

              {/* Location Information */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Region/Zone</label>
                    <p className="font-medium">
                      {detail.adminRegion || 'N/A'} / {detail.zone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Woreda/Kebele</label>
                    <p className="font-medium">
                      {detail.wereda || 'N/A'} / {detail.kebele || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Address</label>
                    <p className="font-medium">
                      {[detail.houseNo, detail.street, detail.city].filter(Boolean).join(', ') || 'N/A'}
                    </p>
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

              {/* Additional Information */}
              <Card className='border-none shadow-xs'>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">SMS Notification</label>
                    <p className="font-medium">{detail.sendSMS || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="font-medium">{detail.ttDescription || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Remark</label>
                    <p className="font-medium">{detail.Remark && detail.Remark !== '?' ? detail.Remark : 'N/A'}</p>
                  </div>
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

