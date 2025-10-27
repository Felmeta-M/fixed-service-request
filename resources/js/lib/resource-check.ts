import axios from 'axios';

export interface ResourceCheckRequest {
    prod_spec_code: string;
    number_line: string;
    acc_nbr: string;
    event_code: string;
    cust_id: string;
    cust_name: string;
    cust_addr: string;
    longitude: string;
    latitude: string;
    bandwidth: string;
    radius: string;
    combo_flag: string;
}

export interface ResourceCheckResponse {
    success: boolean;
    message: string;
    data?: {
        distance: string;
        ava_port: string;
        neid: string;
        nename: string;
        typeid: string;
        longitude: string;
        latitude: string;
        cable_type: string;
        cable_type_desc: string;
    };
}

// Helper function to extract customer data from localStorage
const getCustomerDataFromStorage = () => {
    try {
        let cust_id = '';
        let cust_name = '';
        let cust_addr = 'aa';
        let contactNo = '';

        // Check for National ID verification data first (KYC)
        const kycDataString = localStorage.getItem('kycData');
        if (kycDataString) {
            try {
                const kycData = JSON.parse(kycDataString);

                cust_id = kycData.customer_data?.customer?.id || '';
                cust_name = kycData.identity?.name?.eng || '';

                // Build address from KYC data if available
                if (kycData.identity?.address) {
                    const addr = kycData.identity.address;
                    cust_addr = `${addr.region || 'aa'} ${addr.city || 'a'} ${addr.subcity || ''} ${addr.wereda || ''}`.trim();
                }

                contactNo = kycData.identity?.phone || '';
            } catch (e) {
                console.error('Error parsing KYC data:', e);
            }
        }

        // If no KYC data or incomplete, check for phone verification data
        const customerDataString = localStorage.getItem('activeCustomer');
        if (customerDataString && (!cust_id || !cust_name)) {
            try {
                const customerData = JSON.parse(customerDataString);

                if (customerData.customer) {
                    const customer = customerData.customer;
                    cust_id = customer.id || cust_id;
                    cust_name = `${customer.first_name || ''} ${customer.middle_name || ''} ${customer.last_name || ''}`.trim() || cust_name;

                    if (customer.address) {
                        const addr = customer.address;
                        cust_addr = `${addr.region || ''} ${addr.zone || ''} ${addr.wereda || ''} ${addr.kebele || ''}`.trim();
                    }
                }

                if (customerData.contacts && customerData.contacts.length > 0) {
                    const contact = customerData.contacts[0];
                    cust_name = cust_name || `${contact.name1 || ''} ${contact.name2 || ''}`.trim();
                    contactNo = contactNo || contact.mobile || '';

                    if (!cust_addr && contact.address) {
                        cust_addr = contact.address;
                    }
                }
            } catch (e) {
                console.error('Error parsing customer data:', e);
            }
        }

        return { cust_id, cust_name, cust_addr, contactNo };
    } catch (error) {
        console.error('Error getting customer data from storage:', error);
        return { cust_id: '', cust_name: '', cust_addr: '', contactNo: '' };
    }
};

export const checkResourceAvailability = async (
    coordinates: { latitude: number; longitude: number },
    customerName: string,
): Promise<{ available: boolean; message: string; data?: any }> => {
    try {
        const customerData = getCustomerDataFromStorage();

        const requestData: ResourceCheckRequest = {
            prod_spec_code: 'C_P_UFBI_E',
            event_code: '101',
            cust_id: customerData.cust_id,
            cust_name: customerData.cust_name || customerName,
            cust_addr: customerData.cust_addr,
            longitude: coordinates.longitude.toString(),
            latitude: coordinates.latitude.toString(),
            number_line: '1',
            acc_nbr: '-1',
            bandwidth: '',
            radius: '200',
            combo_flag: '0',
        };

        console.log('Resource check request data:', requestData);

        const response = await axios.post<ResourceCheckResponse>('http://localhost:8000/api/v1/resource-check', requestData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Updated logic based on the new response structure
        if (response.data.success && response.data.data) {
            const resourceData = response.data.data;
            const availablePorts = parseInt(resourceData.ava_port) || 0;
            const distance = parseFloat(resourceData.distance) || 0;

            // Resource is available if there are available ports and distance is within reasonable range
            const isAvailable = availablePorts > 0 && distance <= 200; // 200 meters radius

            return {
                available: isAvailable,
                message: isAvailable
                    ? `Resource available (${availablePorts} ports, ${distance}m from node)`
                    : 'No available resources in this location',
                data: resourceData,
            };
        }

        return {
            available: false,
            message: response.data.message || 'Resource check failed',
            data: response.data.data,
        };
    } catch (error) {
        console.error('Resource check failed:', error);
        return {
            available: false,
            message: 'Failed to check resource availability. Please try again.',
        };
    }
};
