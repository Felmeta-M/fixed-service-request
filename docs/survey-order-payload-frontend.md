# Survey order payload – how the frontend sends data

## API endpoint

- **Auto flow:** `POST /api/v1/survey/create`
- **Manual flow:** `POST /api/v1/survey/create-manual`

Payload is sent as JSON in the request body (via `apiClient.post(endpoint, data, { token })`).

---

## Where the payload is built

| Entry point | File | Bandwidth source |
|-------------|------|------------------|
| **Service creation flow (review & submit)** | `resources/js/features/services/components/steps/review-submit-step.tsx` | `formData.bandwidth` from Zustand store (set by `BandwidthSelector` in `service-selection-step.tsx`) |
| **Manual survey step** | `resources/js/features/services/components/steps/manual-survey-step.tsx` | Fixed `'7M'` for minimal manual flow |
| **Manual create page** | `resources/js/pages/services/manual-create.tsx` | `formData.bandwidth` from form |
| **Survey requests create (legacy)** | `resources/js/pages/survey-requests/create.tsx` | Was hardcoded `'2048M'`; fixed to use selected bandwidth (see below) |

---

## Bandwidth values

- **Allowed values (backend validation):** `7M`, `10M`, `15M`, `20M`, `30M`, `50M`, `100M`, `200M`, `500M`, `1Gbps`
- **Options shown in UI:** From API `GET /api/v1/bandwidth-options/residential` (and optionally enterprise). The backend returns whatever is stored in `bandwidth_options.residential_options` (DB). To avoid validation errors, that list should match the allowed set above.
- **Service flow:** User picks one option in `BandwidthSelector` → stored as `formData.bandwidth` (e.g. `"10M"`) → included in payload as `bandwidth: formData.bandwidth` in `review-submit-step.tsx`.
- **Manual flows:** Send `bandwidth: '7M'` (or another allowed value from the form when applicable).

---

## Example payload (auto flow)

From `review-submit-step.tsx`:

```ts
{
  main_offer_id: formData.serviceType,           // e.g. '1457567289', '102647257', '1207609454'
  survey_address_info: { region_city, subcity_zone, wereda_town, kebele, house_no, address, latitude, longitude, distance, cable_type, neid, nename, area_code, area_name },
  ...(formData.bandwidth && { bandwidth: formData.bandwidth }),  // e.g. '10M', '1Gbps'
  ...(with_device, device_id, device_voice_id, contact_person, contact_no, contact_email as applicable)
}
```

---

## Aligning frontend and backend

1. **Backend** validates `bandwidth` with `Rule::in(['7M', '10M', '15M', ...])` in `SurveyOrderFormRequest`.
2. **Frontend** should only send values from that list. The service flow does this if `/bandwidth-options/residential` returns the same set.
3. **DB/Seeder:** Ensure `bandwidth_options.residential_options` (and any seed data) only contains the allowed values so the dropdown never offers an invalid one.
