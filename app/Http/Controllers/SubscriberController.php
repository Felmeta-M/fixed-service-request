<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use App\Http\Requests\StoreSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SubscriberController extends Controller
{
    public function index()
    {
        $requests = Subscriber::latest()->paginate(10);

        return Inertia::render('Subscriber/Index', [
            'requests' => $requests
        ]);
    }

    public function create()
    {
        return Inertia::render('Subscriber/Create');
    }

    public function store(StoreSubscriber $request)
    {
        $data = $request->validated();
        $data['transaction_id'] = Str::uuid();
        $data['process_time'] = now()->format('YmdHis');

        Subscriber::create($data);

        return redirect()->route('subscribers.index')->with('success', 'Subscriber Request Created');
    }

    public function show(Subscriber $subscriberRequest)
    {
        return Inertia::render('Subscriber/Show', [
            'request' => $subscriberRequest
        ]);
    }

    public function edit(Subscriber $subscriberRequest)
    {
        return Inertia::render('Subscriber/Edit', [
            'request' => $subscriberRequest
        ]);
    }

    public function update(StoreSubscriber $request, Subscriber $subscriberRequest)
    {
        $subscriberRequest->update($request->validated());

        return redirect()->route('subscribers.index')->with('success', 'Subscriber Request Updated');
    }

    public function destroy(Subscriber $subscriberRequest)
    {
        $subscriberRequest->delete();

        return redirect()->route('subscribers.index')->with('success', 'Subscriber Request Deleted');
    }
}
