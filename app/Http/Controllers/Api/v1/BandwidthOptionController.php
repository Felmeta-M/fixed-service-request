<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\BandwidthOption;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BandwidthOptionController extends Controller
{
    public function index()
    {
        $options = BandwidthOption::all();

        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'residential' => 'required|array',
            'enterprise' => 'required|array'
        ]);

        $option = BandwidthOption::create([
            'residential' => json_encode($data['residential']),
            'enterprise' => json_encode($data['enterprise']),
        ]);

        return response()->json([
            'success' => true,
            'data' => $option
        ], 201);
    }

    public function show($id)
    {
        $option = BandwidthOption::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $option
        ]);
    }

    public function update(Request $request, $id)
    {
        $option = BandwidthOption::findOrFail($id);

        $data = $request->validate([
            'residential' => 'sometimes|array',
            'enterprise' => 'sometimes|array'
        ]);

        if (isset($data['residential'])) {
            $option->residential = json_encode($data['residential']);
        }

        if (isset($data['enterprise'])) {
            $option->enterprise = json_encode($data['enterprise']);
        }

        $option->save();

        return response()->json([
            'success' => true,
            'data' => $option
        ]);
    }

    public function destroy($id)
    {
        $option = BandwidthOption::findOrFail($id);
        $option->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
