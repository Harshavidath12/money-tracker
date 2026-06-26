<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = $user->transactions()->with('category');
        
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->has('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->orderByDesc('transaction_date')->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric',
            'type' => 'required|in:income,expense',
            'transaction_date' => 'required|date',
            'description' => 'nullable|string'
        ]);
        $validated['user_id'] = $user->id;
        $transaction = Transaction::create($validated);
        
        return response()->json($transaction->load('category'), 201);
    }

    public function update(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'amount' => 'sometimes|numeric',
            'type' => 'sometimes|in:income,expense',
            'transaction_date' => 'sometimes|date',
            'description' => 'nullable|string'
        ]);
        $transaction->update($validated);
        return response()->json($transaction->load('category'));
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();
        return response()->json(null, 204);
    }
}
