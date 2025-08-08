<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Occupation;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class OccupationController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Occupation::all()
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'remark' => 'required|string|max:255',
        ]);

        $occupation = Occupation::create($data);

        return response()->json([
            'success' => true,
            'data' => $occupation
        ], 201);
    }

    public function show($id)
    {
        $occupation = Occupation::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $occupation
        ]);
    }

    public function update(Request $request, $id)
    {
        $occupation = Occupation::findOrFail($id);

        $data = $request->validate([
            'remark' => 'required|string|max:255',
        ]);

        $occupation->update($data);

        return response()->json([
            'success' => true,
            'data' => $occupation
        ]);
    }

    public function destroy($id)
    {
        $occupation = Occupation::findOrFail($id);
        $occupation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Occupation deleted successfully'
        ]);
    }
}
