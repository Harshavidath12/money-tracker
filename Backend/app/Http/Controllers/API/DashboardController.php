<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // 1. Balance Summary
        $totalIncome = $user->transactions()->where('type', 'income')->sum('amount');
        $totalExpense = $user->transactions()->where('type', 'expense')->sum('amount');
        $netBalance = $totalIncome - $totalExpense;

        $monthlyIncome = $user->transactions()
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');
            
        $monthlyExpense = $user->transactions()
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // 2. Budget Progress
        $categories = $user->categories()->withSum(['transactions' => function ($query) use ($startOfMonth, $endOfMonth) {
            $query->whereBetween('transaction_date', [$startOfMonth, $endOfMonth]);
        }], 'amount')->get();

        // 3. Analytics (Last 6 Months Income vs Expense)
        $sixMonthsAgo = $now->copy()->subMonths(5)->startOfMonth();
        $monthlyData = $user->transactions()
            ->where('transaction_date', '>=', $sixMonthsAgo)
            ->selectRaw("DATE_FORMAT(transaction_date, '%Y-%m') as month, type, SUM(amount) as total")
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get();
            
        // Process for Chart.js
        $chartData = [
            'labels' => [],
            'income' => [],
            'expense' => []
        ];
        
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $months[$now->copy()->subMonths($i)->format('Y-m')] = ['income' => 0, 'expense' => 0];
            $chartData['labels'][] = $now->copy()->subMonths($i)->format('M Y');
        }
        
        foreach($monthlyData as $data) {
            if(isset($months[$data->month])) {
                $months[$data->month][$data->type] = $data->total;
            }
        }
        
        foreach($months as $m) {
            $chartData['income'][] = $m['income'];
            $chartData['expense'][] = $m['expense'];
        }

        return response()->json([
            'summary' => [
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
                'netBalance' => $netBalance,
                'monthlyIncome' => $monthlyIncome,
                'monthlyExpense' => $monthlyExpense,
            ],
            'categories' => $categories,
            'chartData' => $chartData
        ]);
    }
}
