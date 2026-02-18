<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Pool Transactions Export</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            color: #1f2937;
            margin: 0;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #E75234;
        }

        .header h1 {
            font-size: 18px;
            color: #E75234;
            margin: 0 0 5px;
        }

        .header p {
            color: #6b7280;
            margin: 0;
            font-size: 10px;
        }

        .summary {
            display: flex;
            margin-bottom: 20px;
        }

        .summary-box {
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px 15px;
            margin-right: 10px;
            display: inline-block;
            width: 22%;
        }

        .summary-box .label {
            font-size: 9px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-box .value {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            margin-top: 3px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th {
            background-color: #E75234;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        td {
            padding: 7px 6px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 10px;
        }

        tr:nth-child(even) {
            background-color: #fafafa;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
        }

        .badge-deposit {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-release {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-refund {
            background: #ede9fe;
            color: #5b21b6;
        }

        .badge-fee {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-completed {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-frozen {
            background: #dbeafe;
            color: #1e40af;
        }

        .credit {
            color: #059669;
            font-weight: bold;
        }

        .debit {
            color: #dc2626;
            font-weight: bold;
        }

        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 9px;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>PawLink Money Pool — Transaction Report</h1>
        <p>Generated on {{ now()->format('F d, Y \a\t h:i A') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Type</th>
                <th>User</th>
                <th>Contract</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $txn)
            <tr>
                <td>#{{ $txn->id }}</td>
                <td>
                    @php
                    $badgeClass = match($txn->type) {
                    'deposit', 'hold' => 'badge-deposit',
                    'release' => 'badge-release',
                    'refund' => 'badge-refund',
                    default => 'badge-fee',
                    };
                    @endphp
                    <span class="badge {{ $badgeClass }}">{{ $txn->type_label }}</span>
                </td>
                <td>{{ $txn->user->name ?? 'N/A' }}</td>
                <td>{{ $txn->contract_id ? '#' . $txn->contract_id : '—' }}</td>
                <td class="{{ $txn->isCredit() ? 'credit' : 'debit' }}">
                    {{ $txn->isCredit() ? '+' : '-' }}₱{{ number_format($txn->amount, 2) }}
                </td>
                <td>₱{{ number_format($txn->balance_after, 2) }}</td>
                <td>
                    @php
                    $statusBadge = match($txn->status) {
                    'completed' => 'badge-completed',
                    'pending' => 'badge-pending',
                    'frozen' => 'badge-frozen',
                    default => 'badge-fee',
                    };
                    @endphp
                    <span class="badge {{ $statusBadge }}">{{ $txn->status_label }}</span>
                </td>
                <td>{{ $txn->created_at->format('M d, Y H:i') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>PawLink Admin — Money Pool Transaction Report • {{ $transactions->count() }} records exported</p>
    </div>
</body>

</html>