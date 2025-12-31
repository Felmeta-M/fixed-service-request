import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TTDetail, TTActivity } from '@/types/tt';
import { Calendar, MapPin, Phone, User, FileText, Clock, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirmFeedback } from '@/hooks/use-api-mutations';

interface TTDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: TTDetail | null;
  loading: boolean;
  source?: 'local' | 'external';
  onConfirmSuccess?: () => void;
}

export function TTDetailDialog({
  open,
  onOpenChange,
  detail,
  loading,
  source = 'external',
  onConfirmSuccess,
}: TTDetailDialogProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [resultCode, setResultCode] = useState<'0' | '1'>('0');

  const confirmFeedbackMutation = useConfirmFeedback();
  const confirming = confirmFeedbackMutation.isPending;

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
          onConfirmSuccess?.();
          // Optionally close the dialog after successful confirmation
          // onOpenChange(false);
        },
      }
    );
  };

  // Only show feedback form for external tickets
  const canConfirmFeedback = source === 'external' && detail?.result_code === '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            TT Details: {detail?.ttNumber || 'Loading...'}
          </DialogTitle>
          <DialogDescription>
            Complete information about the trouble ticket
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading details...</p>
            </div>
          </div>
        ) : detail ? (
          <ScrollArea className="h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6">
              {/* Header with Status */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{detail.troubleTitle || 'N/A'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {detail.troubleReason || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={detail.result_code === '0' ? 'default' : 'destructive'}>
                      {detail.result_code === '0' ? 'Active' : 'Failed'}
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
              </div>

              {/* Feedback Confirmation Form */}
              {showFeedbackForm && (
                <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                  <h4 className="font-medium mb-3">Confirm Feedback</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant={resultCode === '0' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResultCode('0')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolved
                      </Button>
                      <Button
                        variant={resultCode === '1' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setResultCode('1')}
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
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="space-y-3">
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
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
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
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Service Information
                  </h4>
                  <div className="space-y-3">
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
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <div className="space-y-3">
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
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </h4>
                  <div className="space-y-3">
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
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Additional Information
                  </h4>
                  <div className="space-y-3">
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
                  </div>
                </div>
              </div>

              {/* Activities Section */}
              {detail.activities && Array.isArray(detail.activities) && detail.activities.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Activity History
                  </h4>
                  <div className="space-y-3">
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
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No details available
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
