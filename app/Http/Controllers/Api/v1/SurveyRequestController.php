<?php

namespace App\Http\Controllers;

use App\Models\SurveyRequest;
use Inertia\Inertia;
use App\Models\Customer;
use Illuminate\Http\Request;

class SurveyRequestController extends Controller
{
    public function index()
    {
        return Inertia::render('SurveyRequests/Index', [
            'surveyRequests' => SurveyRequest::with('customer')->latest()->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('SurveyRequests/Create', [
            'customers' => Customer::select('id', 'first_name', 'last_name')->get(),
        ]);
    }

    public function store(SurveyRequest $request)
    {
        $data = $request->validated();
        $data['customer_survey_order_id'] = $this->generateUniqueRequestNumber();

        SurveyRequest::create($data);

        return redirect()->route('survey-requests.index')->with('success', 'Survey request created.');
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

    public function update(SurveyRequestFormRequest $request, SurveyRequest $surveyRequest)
    {
        $surveyRequest->update($request->validated());

        return redirect()->route('survey-requests.index')->with('success', 'Survey request updated.');
    }

    public function destroy(SurveyRequest $surveyRequest)
    {
        $surveyRequest->delete();

        return redirect()->route('survey-requests.index')->with('success', 'Survey request deleted.');
    }

    private function generateUniqueRequestNumber(): string
    {
        do {
            $number = 'SURV-' . rand(100000, 999999);
        } while (SurveyRequest::where('customer_survey_order_id', $number)->exists());

        return $number;
    }
}
