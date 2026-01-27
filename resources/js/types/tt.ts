export interface ExternalTTListItem {
  tt_no: string;
  cust_name: string;
  acc_number: string;
  trouble_title: string;
  accept_time: string;
  trouble_reason: string;
  deadline: string;
  current_activity: string;
  handler: string;
  tt_status: string;
}

export interface TTDetail {
  ttNumber: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  customerType: string;
  customerLevel: string;
  customerCategory: string;
  custSubCategory: string;
  custID: string;
  subsID: string;
  adminRegion: string;
  zone: string;
  city: string;
  subCity: string;
  wereda: string;
  kebele: string;
  street: string;
  houseNo: string;
  buildingName: string;
  floor: string;
  roomNo: string;
  accessNumber: string;
  acctNumber: string;
  additionalFaultyNbr: string;
  contactPerson: string;
  mobileNo: string;
  telephoneNo: string;
  email: string;
  troubleTitle: string;
  troubleReason: string;
  troubleGrand: string;
  deadline: string;
  acceptTime: string;
  occurrenceDate: string;
  expectFeedbackTime: string;
  faultLocation: string;
  sendSMS: string;
  ttDescription: string;
  Remark: string;
  attachment: string;
  result_code: string;
  desc: string;
  activities: TTActivity[];
}

export interface TTActivity {
  activity_name: string;
  tt_status: string;
  out_time: string;
  in_time: string;
  handler: string;
  remarks: string;
}

// Local Database Interfaces
export interface LocalTroubleTicket {
  id: number;
  tt_serial_no: string;
  trouble_title: string;
  access_number: string;
  account_number?: string;
  contact_person: string;
  mobile_no: string;
  trouble_reason: string;
  tt_description: string;
  occurrence_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  external_tt_no?: string; // If synced with external system
  created_at: string;
  updated_at: string;
  user_id?: number;
  
  // Who created the TT (logged-in user)
  customer_code?: string;
  
  // Service owner info (actual owner of the service number)
  service_owner_code?: string;
  service_owner_name?: string;
  service_owner_type?: string;
  service_owner_level?: string;
  
  // Service location/address
  region?: string;
  zone?: string;
  city?: string;
  sub_city?: string;
  wereda?: string;
  kebele?: string;
  house_no?: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url?: string;
    label: string;
    active: boolean;
  }>;
  next_page_url?: string;
  path: string;
  per_page: number;
  prev_page_url?: string;
  to: number;
  total: number;
}

// Request/Response Interfaces
export interface TTQueryResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    tt_list: ExternalTTListItem[];
  };
}

export interface TTDetailResponse {
  success: boolean;
  message: string;
  data: TTDetail;
  error?: string;
}

export interface LocalTTResponse {
  success: boolean;
  data: PaginatedResponse<LocalTroubleTicket>;
}

export interface SingleTTResponse {
  success: boolean;
  data: LocalTroubleTicket;
  message?: string;
}

export interface TTQueryRequest {
  access_number: string;
}

export interface TTDetailRequest {
  search: string;
}

export interface LocalTTQueryParams {
  access_number?: string;
  tt_serial_no?: string;
  mobile_no?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface ConfirmFeedbackRequest {
  tt_no: string;
  result_code: '0' | '1'; // 0 = success/closed, 1 = failed
  desc: string;
}

export interface ConfirmFeedbackResponse {
  success: boolean;
  data: {
    success: boolean;
    requestor?: string;
    result_code: string;
    desc: string;
  };
}

// Combined interface for display
export interface DisplayTT {
  id: string | number;
  tt_no: string;
  source: 'local' | 'external';
  cust_name: string;
  access_number: string;
  trouble_title: string;
  accept_time: string;
  trouble_reason: string;
  deadline: string;
  status: string;
  created_at: string;
  local_data?: LocalTroubleTicket;
  external_data?: ExternalTTListItem;
}