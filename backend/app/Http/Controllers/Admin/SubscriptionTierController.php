<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionTier;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class SubscriptionTierController extends Controller
{
    /**
     * Display a listing of the subscription tiers.
     */
    public function index()
    {
        $tiers = SubscriptionTier::all();
        return view('admin.subscription-tiers.index', compact('tiers'));
    }

    /**
     * Update the specified subscription tier in storage.
     */
    public function update(Request $request, $id)
    {
        $tier = SubscriptionTier::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
            'features' => 'nullable|array',
        ]);

        $oldValues = $tier->toArray();
        $tier->update($request->all());

        AuditLog::log(
            'subscription_tier.updated',
            AuditLog::TYPE_UPDATE,
            "Subscription tier '{$tier->name}' updated",
            SubscriptionTier::class,
            $tier->id,
            $oldValues,
            $tier->toArray()
        );

        return redirect()->route('admin.subscription-tiers.index')
            ->with('success', 'Subscription tier updated successfully.');
    }
}
