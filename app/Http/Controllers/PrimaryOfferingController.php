<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\GetPrimaryOffering;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrimaryOfferingController extends Controller
{

    public function __construct(protected readonly GetPrimaryOffering $service) {}

    public function index()
    {
        return Inertia::render('PrimaryOffering/Index');
    }

    public function store(Request $request)
    {
        $request->validate([
            'object_id' => 'required|string',
        ]);

        $offering = $this->service->queryAvailablePrimaryOffering($request->input('object_id'));

        if (!$offering) {
            return back()->with('error', 'No offering found or API failed.');
        }

        return Inertia::render('PrimaryOffering/Show', [
            'offering' => $offering,
        ]);
    }

    public function show($objectId)
    {
        $offering = $this->service->queryAvailablePrimaryOffering($objectId);

        if (!$offering) {
            return back()->with('error', 'No offering found or API failed.');
        }

        return Inertia::render('PrimaryOffering/Show', [
            'offering' => $offering,
        ]);
    }

    public function create() {}
    public function edit($id) {}
    public function update(Request $request, $id) {}
    public function destroy($id) {}
}
