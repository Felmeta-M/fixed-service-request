import {
  TTQueryRequest,
  TTQueryResponse,
  TTDetailRequest,
  TTDetailResponse,
  LocalTTResponse,
  SingleTTResponse,
  LocalTTQueryParams,
  DisplayTT,
  ConfirmFeedbackRequest,
  ConfirmFeedbackResponse
} from '@/types/tt';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(public message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let data = null;
    try {
      const json = await response.json();
      message = json.message || message;
      data = json;
    } catch (e) {
      // ignore if not json
    }
    throw new ApiError(message, response.status, data);
  }
  return await response.json();
}

export const ttService = {
  async queryExternalTTs(accessNumber: string, token?: string): Promise<TTQueryResponse> {
    try {
      const response = await fetch(`${API_BASE}/tt/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ access_number: accessNumber } as TTQueryRequest),
      });

      return await handleResponse<TTQueryResponse>(response);
    } catch (error) {
      console.error('External TT Query Error:', error);
      throw error;
    }
  },

  async getTTDetail(ttNumber: string, token?: string): Promise<TTDetailResponse> {
    try {
      const response = await fetch(`${API_BASE}/tt/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ search: ttNumber } as TTDetailRequest),
      });

      return await handleResponse<TTDetailResponse>(response);
    } catch (error) {
      console.error('TT Detail Error:', error);
      throw error;
    }
  },

  async getLocalTTs(params: LocalTTQueryParams, token?: string): Promise<LocalTTResponse> {
    try {
      const queryString = new URLSearchParams();

      if (params.access_number) queryString.append('access_number', params.access_number);
      if (params.mobile_no) queryString.append('mobile_no', params.mobile_no);
      if (params.status) queryString.append('status', params.status);
      if (params.page) queryString.append('page', params.page.toString());
      if (params.per_page) queryString.append('per_page', params.per_page.toString());

      const response = await fetch(`${API_BASE}/trouble-tickets?${queryString.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      return await handleResponse<LocalTTResponse>(response);
    } catch (error) {
      console.error('Local TT Fetch Error:', error);
      throw error;
    }
  },

  async getLocalTT(ttSerialNo: string, token?: string): Promise<SingleTTResponse> {
    try {
      const response = await fetch(`${API_BASE}/trouble-tickets/${ttSerialNo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      return await handleResponse<SingleTTResponse>(response);
    } catch (error) {
      console.error('Local TT Detail Error:', error);
      throw error;
    }
  },

  async createLocalTT(data: any, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/tt/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return await handleResponse<any>(response);
    } catch (error) {
      console.error('Create TT Error:', error);
      throw error;
    }
  },

  async searchAllTTs(accessNumber: string, token?: string): Promise<DisplayTT[]> {
    const displayTTs: DisplayTT[] = [];

    try {
      const localResponse = await this.getLocalTTs({
        access_number: accessNumber,
      }, token);

      if (localResponse.success && localResponse.data.data.length > 0) {
        localResponse.data.data.forEach((localTT) => {
          displayTTs.push({
            id: `local_${localTT.id}`,
            tt_no: localTT.tt_serial_no,
            source: 'local' as const,
            cust_name: localTT.contact_person,
            access_number: localTT.access_number,
            trouble_title: localTT.trouble_title,
            accept_time: localTT.created_at,
            trouble_reason: localTT.trouble_reason,
            deadline: '',
            status: localTT.status,
            created_at: localTT.created_at,
            local_data: localTT,
          });
        });
      }

      const externalResponse = await this.queryExternalTTs(accessNumber, token);

      if (externalResponse.success &&
        externalResponse.data.success &&
        externalResponse.data.tt_list.length > 0) {
        externalResponse.data.tt_list.forEach((externalTT) => {
          displayTTs.push({
            id: `external_${externalTT.tt_no}`,
            tt_no: externalTT.tt_no,
            source: 'external' as const,
            cust_name: externalTT.cust_name,
            access_number: externalTT.acc_number,
            trouble_title: externalTT.trouble_title,
            accept_time: externalTT.accept_time,
            trouble_reason: externalTT.trouble_reason,
            deadline: externalTT.deadline,
            status: externalTT.tt_status || 'unknown',
            created_at: externalTT.accept_time,
            external_data: externalTT,
          });
        });
      }

    } catch (error) {
      console.error('Combined search error:', error);
    }

    return displayTTs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getUserLocalTTs(userId?: number, phone?: string, token?: string): Promise<DisplayTT[]> {
    try {
      const params: LocalTTQueryParams = {};

      if (phone) {
        params.mobile_no = phone;
      }

      const response = await this.getLocalTTs(params, token);

      if (response.success) {
        return response.data.data.map((localTT) => ({
          id: `local_${localTT.id}`,
          tt_no: localTT.tt_serial_no,
          source: 'local' as const,
          cust_name: localTT.contact_person,
          access_number: localTT.access_number,
          trouble_title: localTT.trouble_title,
          accept_time: localTT.created_at,
          trouble_reason: localTT.trouble_reason,
          deadline: '',
          status: localTT.status,
          created_at: localTT.created_at,
          local_data: localTT,
        }));
      }

      return [];
    } catch (error) {
      console.error('Get user TTs error:', error);
      return [];
    }
  },

  async confirmFeedback(data: ConfirmFeedbackRequest, token?: string): Promise<ConfirmFeedbackResponse> {
    try {
      const response = await fetch(`${API_BASE}/tt/confirm-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return await handleResponse<ConfirmFeedbackResponse>(response);
    } catch (error) {
      console.error('Confirm Feedback Error:', error);
      throw error;
    }
  },
};