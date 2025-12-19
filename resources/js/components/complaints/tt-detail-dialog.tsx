import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TTDetail } from '@/types/tt';
import { Calendar, MapPin, Phone, User, FileText, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TTDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: TTDetail | null;
  loading: boolean;
}

export function TTDetailDialog({
  open,
  onOpenChange,
  detail,
  loading,
}: TTDetailDialogProps) {
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '?') return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            TT Details: {detail?.ttNumber}
          </DialogTitle>
          <DialogDescription>
            Complete information about the trouble ticket
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading details...</p>
            </div>
          </div>
        ) : detail ? (
          <ScrollArea className="h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Header with Status */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{detail.troubleTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {detail.troubleReason}
                    </p>
                  </div>
                  <Badge variant={detail.result_code === '0' ? 'default' : 'destructive'}>
                    {detail.result_code === '0' ? 'Active' : 'Failed'}
                  </Badge>
                </div>
              </div>

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
                        {detail.title} {detail.firstName} {detail.middleName} {detail.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Customer Type</label>
                      <p className="font-medium">{detail.customerType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Category</label>
                      <p className="font-medium">{detail.customerCategory} / {detail.custSubCategory}</p>
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
                      <p className="font-medium">{detail.contactPerson}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Mobile</label>
                      <p className="font-medium">{detail.mobileNo}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{detail.email !== '?' ? detail.email : 'N/A'}</p>
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
                      <p className="font-medium">{detail.accessNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Account Number</label>
                      <p className="font-medium">{detail.acctNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Subscriber ID</label>
                      <p className="font-medium">{detail.subsID}</p>
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
                      <p className="font-medium">{detail.adminRegion} / {detail.zone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Woreda/Kebele</label>
                      <p className="font-medium">{detail.wereda} / {detail.kebele}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Address</label>
                      <p className="font-medium">
                        {detail.houseNo} {detail.street}, {detail.city}
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
                      <p className="font-medium">{detail.sendSMS}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Description</label>
                      <p className="font-medium">{detail.ttDescription}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Remark</label>
                      <p className="font-medium">{detail.Remark !== '?' ? detail.Remark : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activities Section */}
              {detail.activities && detail.activities.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Activities</h4>
                  <div className="space-y-3">
                    {detail.activities.map((activity, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4 py-2">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          By {activity.handler} at {formatDate(activity.timestamp)}
                        </p>
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
      </DialogContent>
    </Dialog>
  );
}