# Firewall Access Request

## Application Details

| Field | Value |
|-------|-------|
| **Application Name** | Fixed Services Provision System |
| **Environment** | Production |
| **Application URL** | https://fixedservices.ethiotelecom.et |
| **Requested By** | [Your Name] |
| **Department** | [Your Department] |
| **Request Date** | [Date] |
| **Priority** | High |

---

## Business Justification

The Fixed Services Provision System requires network access to multiple internal and external services for:

1. **Customer Management** - Create, query, and manage customer profiles via BSS/CRM APIs
2. **Service Provisioning** - Survey orders, subscription management, bandwidth changes
3. **Trouble Ticket Management** - Create and track customer complaints via OSS
4. **Payment Processing** - Telebirr mobile money integration
5. **Identity Verification** - Fayda National ID authentication
6. **SMS Notifications** - Customer notifications via SMS gateway
7. **Location Services** - Google Maps for service location verification

---

## Firewall Rules Required

### Internal Network Access (BSS/CRM/OSS)

| # | Source | Destination IP | Port | Protocol | Service Description | Path/Endpoint |
|---|--------|----------------|------|----------|---------------------|---------------|
| 1 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | BSS ECAF Services | /ECAF/BSSForIECAF |
| 2 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | SELFCARE Order Query | /SELFCARE/OrderQueryETCtz |
| 3 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | SELFCARE Order Status | /SELFCARE/HWBSS_Order |
| 4 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | SELFCARE Offering | /SELFCARE/HWBSS_Offering |
| 5 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | FOSS Order Query | /FOSS/OrderQuery |
| 6 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | NID Service | /NIDService/CRM_NID |
| 7 | App Server | REDACTED_INTERNAL_IP | 17130 | TCP/HTTP | CRM IPCC (TT Customer Query) | /IPCC/OrderQueryETCtz |
| 8 | App Server | REDACTED_INTERNAL_IP | 8192 | TCP/HTTP | ECAF Kiosk Webservices | /webservices/ecaf4kiosk |
| 9 | App Server | REDACTED_INTERNAL_IP | 8000 | TCP/HTTPS | OSS Resource Check | /axis2/services/OrderService |
| 10 | App Server | REDACTED_INTERNAL_IP | 8000 | TCP/HTTPS | Trouble Ticket Service | /axis2ofm/services/EthioSPMInterfaceSheet/ |

### Internal Network Access (SMS)

| # | Source | Destination IP | Port | Protocol | Service Description | Path/Endpoint |
|---|--------|----------------|------|----------|---------------------|---------------|
| 11 | App Server | 197.156.68.29 | 80 | TCP/HTTP | SMS Gateway | /vas/index.php |

### External Network Access (Payment & Identity)

| # | Source | Destination | Port | Protocol | Service Description |
|---|--------|-------------|------|----------|---------------------|
| 12 | App Server | 196.188.120.5 | 38443 | TCP/HTTPS | Telebirr Payment Gateway API |
| 13 | App Server | superapp.ethiomobilemoney.et | 38443 | TCP/HTTPS | Telebirr Web Payment Portal |
| 14 | App Server | auth.fayda.et | 443 | TCP/HTTPS | Fayda eSignet Authentication |
| 15 | App Server | maps.googleapis.com | 443 | TCP/HTTPS | Google Maps Geocoding API |

---

## Network Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Fixed Services Provision System                       │
│                     (Docker Container / App Server)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Outbound TCP
                                      ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                      INTERNAL NETWORK                            │
        ├─────────────────────────────────────────────────────────────────┤
        │                                                                  │
        │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
        │  │  BSS/CRM Cluster │  │   OSS Cluster    │  │  SMS Gateway   │ │
        │  │                  │  │                  │  │                │ │
        │  │  REDACTED_INTERNAL_IP   │  │  REDACTED_INTERNAL_IP  │  │ 197.156.68.29  │ │
        │  │  :17130          │  │  :8000 (HTTPS)   │  │ :80            │ │
        │  │                  │  │                  │  │                │ │
        │  │  REDACTED_INTERNAL_IP    │  │  REDACTED_INTERNAL_IP    │  └────────────────┘ │
        │  │  :17130          │  │  :8000 (HTTPS)   │                     │
        │  │                  │  │                  │                     │
        │  │  REDACTED_INTERNAL_IP    │  └──────────────────┘                     │
        │  │  :8192           │                                           │
        │  └──────────────────┘                                           │
        └─────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Outbound TCP/HTTPS
                                      ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                      EXTERNAL NETWORK                            │
        ├─────────────────────────────────────────────────────────────────┤
        │                                                                  │
        │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
        │  │  Telebirr        │  │  Fayda           │  │  Google Maps   │ │
        │  │  Payment         │  │  Authentication  │  │  API           │ │
        │  │                  │  │                  │  │                │ │
        │  │ 196.188.120.5    │  │ auth.fayda.et    │  │ maps.google    │ │
        │  │ :38443           │  │ :443             │  │ apis.com:443   │ │
        │  └──────────────────┘  └──────────────────┘  └────────────────┘ │
        └─────────────────────────────────────────────────────────────────┘
```

---

## Summary by Destination

### REDACTED_INTERNAL_IP:17130 (Primary BSS Endpoint)
Services using this endpoint:
- Customer Create/Query
- Survey Management (Create, Query, Cancel, Summary)
- Subscriber Management
- Primary Offers Query
- Available Number Query
- Account List Query
- One-off Fee Processing
- Number Service Reserve
- Subscription Order Status
- Purchased Offering Query

### REDACTED_INTERNAL_IP:17130 (CRM IPCC)
Services using this endpoint:
- Query Customer for Trouble Ticket (NEW - Currently Blocked)

### REDACTED_INTERNAL_IP:8192 (ECAF Kiosk)
Services using this endpoint:
- ECAF Kiosk Integration

### REDACTED_INTERNAL_IP:8000 (OSS Primary)
Services using this endpoint:
- Resource Check Service

### REDACTED_INTERNAL_IP:8000 (OSS Secondary)
Services using this endpoint:
- Trouble Ticket Creation/Query

---

## Security Considerations

1. **All connections are application-layer authenticated** using service credentials
2. **HTTPS/TLS** is used for sensitive endpoints (OSS, Payment, Identity)
3. **No inbound rules required** - all connections are outbound from application
4. **Rate limiting** is implemented at application level

---

## Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Application Owner | | | |
| Technical Lead | | | |
| Network Team | | | |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Requestor | | | |
| IT Security | | | |
| Network Admin | | | |
| Manager | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-27 | | Initial request |
