<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string',
            'type'           => 'required|in:income,expense',
            'icon'           => 'nullable|string',
            'monthly_budget' => 'nullable|numeric',
        ]);
        $validated['user_id'] = $request->user()->id;
        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name'           => 'sometimes|string',
            'type'           => 'sometimes|in:income,expense',
            'icon'           => 'nullable|string',
            'monthly_budget' => 'nullable|numeric',
        ]);
        $category->update($validated);
        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(null, 204);
    }
}
