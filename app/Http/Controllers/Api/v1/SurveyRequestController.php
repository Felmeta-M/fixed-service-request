<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SurveyOrderFormRequest;
use App\Models\Customer;
use App\Models\SurveyRequest;
use Inertia\Inertia;

class SurveyRequestController extends Controller
{
    public function index()
    {
        return Inertia::render('SurveyRequests/Index', [
            'surveyRequests' => SurveyRequest::with('customer')->latest()->paginate(10),
        ]);
    }

    public function store(SurveyOrderFormRequest $request)
    {
        $data = $request->validated();
        $data['customer_survey_order_id'] = $this->generateUniqueRequestNumber();

        SurveyRequest::create($data);

        return redirect()->route('survey-requests.index')->with('success', 'Survey request created.');
    }

    private function generateUniqueRequestNumber(): string
    {
        do {
            $number = 'SURV-' . rand(100000, 999999);
        } while (SurveyRequest::where('customer_survey_order_id', $number)->exists());

        return $number;
    }

    public function create()
    {
        return Inertia::render('SurveyRequests/Create', [
            'customers' => Customer::select('id', 'first_name', 'last_name')->get(),
        ]);
    }

    public function show(SurveyRequest $surveyRequest)
    {
        return Inertia::render('SurveyRequests/Show', [
            'surveyRequest' => $surveyRequest->load('customer'),
        ]);
    }

    public function edit(SurveyRequest $surveyRequest)
    {
        return Inertia::render('SurveyRequests/Edit', [
            'surveyRequest' => $surveyRequest,
            'customers' => Customer::select('id', 'first_name', 'last_name')->get(),
        ]);
    }

    public function update(SurveyOrderFormRequest $request, SurveyRequest $surveyRequest)
    {
        $surveyRequest->update($request->validated());

        return redirect()->route('survey-requests.index')->with('success', 'Survey request updated.');
    }

    public function destroy(SurveyRequest $surveyRequest)
    {
        $surveyRequest->delete();

        return redirect()->route('survey-requests.index')->with('success', 'Survey request deleted.');
    }
}
