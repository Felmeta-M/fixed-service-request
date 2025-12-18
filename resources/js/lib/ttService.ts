import {
  TTQueryRequest,
  TTQueryResponse,
  TTDetailRequest,
  TTDetailResponse,
  LocalTTResponse,
  SingleTTResponse,
  LocalTTQueryParams,
  DisplayTT
} from '@/types/tt';

const API_BASE = 'https://fixedservices.ethiotelecom.et/api/v1';

export const ttService = {
  async queryExternalTTs(accessNumber: string): Promise<TTQueryResponse> {
    try {
      const response = await fetch(`${API_BASE}/tt/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_number: accessNumber } as TTQueryRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('External TT Query Error:', error);
      throw error;
    }
  },

  async getTTDetail(ttNumber: string): Promise<TTDetailResponse> {
    try {
      const response = await fetch(`${API_BASE}/tt/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search: ttNumber } as TTDetailRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TT Detail Error:', error);
      throw error;
    }
  },

  async getLocalTTs(params: LocalTTQueryParams): Promise<LocalTTResponse> {
    try {
      const queryString = new URLSearchParams();
      
      if (params.access_number) queryString.append('access_number', params.access_number);
      if (params.mobile_no) queryString.append('mobile_no', params.mobile_no);
      if (params.status) queryString.append('status', params.status);
      if (params.page) queryString.append('page', params.page.toString());
      if (params.per_page) queryString.append('per_page', params.per_page.toString());

      const response = await fetch(`${API_BASE}/trouble-tickets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Local TT Fetch Error:', error);
      throw error;
    }
  },

  async getLocalTT(ttSerialNo: string): Promise<SingleTTResponse> {
    try {
      const response = await fetch(`${API_BASE}/trouble-tickets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Local TT Detail Error:', error);
      throw error;
    }
  },

  async createLocalTT(data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/tt/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create TT Error:', error);
      throw error;
    }
  },

  async searchAllTTs(accessNumber: string): Promise<DisplayTT[]> {
    const displayTTs: DisplayTT[] = [];

    try {
      const localResponse = await this.getLocalTTs({
        access_number: accessNumber,
      });

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

      const externalResponse = await this.queryExternalTTs(accessNumber);
      
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

  async getUserLocalTTs(userId?: number, phone?: string): Promise<DisplayTT[]> {
    try {
      const params: LocalTTQueryParams = {};
      
      if (phone) {
        params.mobile_no = phone;
      }
      
      const response = await this.getLocalTTs(params);

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
};