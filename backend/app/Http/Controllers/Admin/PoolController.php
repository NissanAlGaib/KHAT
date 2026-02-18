<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BreedingContract;
use App\Models\Dispute;
use App\Models\Payment;
use App\Models\PoolTransaction;
use App\Services\PoolService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class PoolController extends Controller
{
    private PoolService $poolService;

    public function __construct(PoolService $poolService)
    {
        $this->poolService = $poolService;
    }

    /**
     * Pool dashboard page.
     */
    public function dashboard()
    {
        $stats = $this->poolService->getPoolStatistics();
        $revenueByType = $this->poolService->getRevenueByType();
        $monthlyFlow = $this->poolService->getMonthlyPoolFlow(12);
        $recentTransactions = PoolTransaction::with(['user:id,name,email', 'contract:id,status'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $openDisputesCount = Dispute::active()->count();

        return view('admin.pool.dashboard', compact(
            'stats',
            'revenueByType',
            'monthlyFlow',
            'recentTransactions',
            'openDisputesCount'
        ));
    }

    /**
     * Full transaction log with filters.
     */
    public function transactions(Request $request)
    {
        $query = PoolTransaction::with(['user:id,name,email', 'contract:id,status', 'payment:id,payment_type,amount']);

        // Filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to . ' 23:59:59');
        }
        if ($request->filled('user_search')) {
            $search = $request->user_search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($request->filled('contract_id')) {
            $query->where('contract_id', $request->contract_id);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(25);

        return view('admin.pool.transactions', compact('transactions'));
    }

    /**
     * Per-contract financial detail.
     */
    public function contractDetail(int $contractId)
    {
        $contract = BreedingContract::with([
            'conversation.matchRequest.requesterPet.user:id,name',
            'conversation.matchRequest.targetPet.user:id,name',
            'shooter:id,name',
        ])->findOrFail($contractId);

        $summary = $this->poolService->getContractPoolSummary($contract);

        $payments = Payment::where('contract_id', $contractId)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        $disputes = Dispute::where('contract_id', $contractId)
            ->with(['raisedBy:id,name', 'resolvedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return view('admin.pool.contract-detail', compact('contract', 'summary', 'payments', 'disputes'));
    }

    /**
     * Disputes management page.
     */
    public function disputes(Request $request)
    {
        $query = Dispute::with([
            'contract:id,status,breeding_status,collateral_total',
            'raisedBy:id,name,email',
            'resolvedBy:id,name',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to . ' 23:59:59');
        }

        $disputes = $query->orderBy('created_at', 'desc')->paginate(25);

        return view('admin.pool.disputes', compact('disputes'));
    }

    /**
     * Resolve a dispute.
     */
    public function resolveDispute(Request $request, int $disputeId)
    {
        $validated = $request->validate([
            'resolution_type' => 'required|in:refund_full,refund_partial,release_funds,forfeit',
            'resolved_amount' => 'nullable|numeric|min:0',
            'resolution_notes' => 'nullable|string|max:2000',
        ]);

        $dispute = Dispute::findOrFail($disputeId);

        if (! $dispute->isActive()) {
            return redirect()->back()->with('error', 'This dispute has already been resolved.');
        }

        $adminId = auth()->id();

        $result = $this->poolService->resolveDispute(
            $dispute,
            $validated['resolution_type'],
            $validated['resolved_amount'] ?? null,
            $adminId
        );

        // Update resolution notes
        if (! empty($validated['resolution_notes'])) {
            $dispute->update(['resolution_notes' => $validated['resolution_notes']]);
        }

        Log::info('Dispute resolved by admin', [
            'dispute_id' => $dispute->id,
            'admin_id' => $adminId,
            'resolution_type' => $validated['resolution_type'],
            'result' => $result,
        ]);

        return redirect()->back()->with('success', 'Dispute resolved successfully.');
    }

    /**
     * Freeze a specific transaction.
     */
    public function freezeTransaction(int $transactionId)
    {
        $transaction = PoolTransaction::findOrFail($transactionId);

        if ($transaction->isFrozen()) {
            return redirect()->back()->with('error', 'Transaction is already frozen.');
        }

        $transaction->update(['status' => PoolTransaction::STATUS_FROZEN]);

        // Also freeze the payment
        if ($transaction->payment) {
            $transaction->payment->update(['pool_status' => Payment::POOL_FROZEN]);
        }

        Log::info('Transaction frozen by admin', [
            'transaction_id' => $transactionId,
            'admin_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Transaction frozen.');
    }

    /**
     * Unfreeze a specific transaction.
     */
    public function unfreezeTransaction(int $transactionId)
    {
        $transaction = PoolTransaction::findOrFail($transactionId);

        if (! $transaction->isFrozen()) {
            return redirect()->back()->with('error', 'Transaction is not frozen.');
        }

        $transaction->update(['status' => PoolTransaction::STATUS_COMPLETED]);

        if ($transaction->payment) {
            $transaction->payment->update(['pool_status' => Payment::POOL_IN_POOL]);
        }

        Log::info('Transaction unfrozen by admin', [
            'transaction_id' => $transactionId,
            'admin_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Transaction unfrozen.');
    }

    /**
     * Force release/refund a transaction.
     */
    public function forceRelease(Request $request, int $transactionId)
    {
        $transaction = PoolTransaction::with('payment')->findOrFail($transactionId);

        if (! $transaction->payment) {
            return redirect()->back()->with('error', 'No payment associated with this transaction.');
        }

        $payment = $transaction->payment;

        // If frozen, unfreeze first
        if ($transaction->isFrozen()) {
            $transaction->update(['status' => PoolTransaction::STATUS_COMPLETED]);
        }

        // Attempt PayMongo refund
        $result = null;
        if ($payment->paymongo_payment_id) {
            $amountInCentavos = (int) round((float) $payment->amount * 100);
            $payMongoService = app(PayMongoService::class);
            $result = $payMongoService->createRefund(
                $payment->paymongo_payment_id,
                $amountInCentavos,
                'requested_by_customer'
            );
        }

        $currentBalance = $this->poolService->getPoolBalance();

        // Create release transaction
        PoolTransaction::create([
            'payment_id' => $payment->id,
            'contract_id' => $payment->contract_id,
            'user_id' => $payment->user_id,
            'type' => PoolTransaction::TYPE_REFUND,
            'amount' => $payment->amount,
            'currency' => $payment->currency ?? 'PHP',
            'balance_after' => $currentBalance - (float) $payment->amount,
            'status' => ($result && $result['success']) ? PoolTransaction::STATUS_COMPLETED : PoolTransaction::STATUS_PENDING,
            'description' => 'Admin force release',
            'metadata' => [
                'admin_id' => auth()->id(),
                'paymongo_refund_id' => $result['refund_id'] ?? null,
            ],
            'processed_at' => now(),
            'processed_by' => auth()->id(),
        ]);

        $payment->update([
            'pool_status' => Payment::POOL_REFUNDED,
            'paymongo_refund_id' => $result['refund_id'] ?? null,
        ]);

        Log::info('Admin force released payment', [
            'transaction_id' => $transactionId,
            'payment_id' => $payment->id,
            'admin_id' => auth()->id(),
            'refund_success' => $result['success'] ?? false,
        ]);

        $message = ($result && $result['success'])
            ? 'Payment refunded via PayMongo.'
            : 'Payment marked as released. PayMongo refund may require manual processing.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Export pool transactions as CSV or PDF.
     */
    public function export(Request $request)
    {
        $format = $request->get('format', 'csv');

        $query = PoolTransaction::with(['user:id,name,email', 'contract:id,status', 'payment:id,payment_type,amount']);

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to . ' 23:59:59');
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->orderBy('created_at', 'desc')->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('admin.exports.pool-transactions-pdf', compact('transactions'));
            return $pdf->download('pool-transactions-' . now()->format('Y-m-d') . '.pdf');
        }

        // CSV export
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=pool-transactions-' . now()->format('Y-m-d') . '.csv',
        ];

        $callback = function () use ($transactions) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Date', 'User', 'Contract', 'Type', 'Amount', 'Currency', 'Status', 'Description']);

            foreach ($transactions as $txn) {
                fputcsv($file, [
                    $txn->id,
                    $txn->created_at->format('Y-m-d H:i:s'),
                    $txn->user->name ?? 'N/A',
                    $txn->contract_id ?? 'N/A',
                    $txn->type_label,
                    number_format((float) $txn->amount, 2),
                    $txn->currency,
                    $txn->status_label,
                    $txn->description,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
