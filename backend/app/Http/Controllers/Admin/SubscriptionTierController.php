<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionTier;
use App\Models\AuditLog;
use App\Http\Controllers\Admin\Traits\Exportable;
use Illuminate\Http\Request;

class SubscriptionTierController extends Controller
{
    use Exportable;

    /**
     * Display a listing of the subscription tiers.
     */
    public function index(Request $request)
    {
        $tiers = SubscriptionTier::query();

        // Search filter
        if ($search = $request->input('search')) {
            $tiers->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $tiers->where('is_active', $request->status === 'active');
        }

        if ($request->has('export')) {
            $csvColumns = [
                'Name' => 'name',
                'Slug' => 'slug',
                'Price' => 'price',
                'Duration' => 'duration_days',
                'Active' => function ($row) {
                    return $row->is_active ? 'Yes' : 'No';
                }
            ];
            return $this->export($tiers, $request->export, 'subscription_tiers', 'admin.exports.subscription-tiers-pdf', [], $csvColumns);
        }

        $tiers = $tiers->get();
        return view('admin.subscription-tiers.index', compact('tiers'));
    }

    /**
     * Store a newly created subscription tier.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_tiers,slug',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'max_pets' => 'nullable|integer|min:1',
            'max_matches' => 'nullable|integer|min:1',
            'max_ai_generations' => 'nullable|integer|min:1',
        ]);

        $tier = SubscriptionTier::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'price' => $request->price,
            'duration_days' => $request->duration_days,
            'is_active' => true,
            'features' => [
                'max_pets' => $request->max_pets ? (int) $request->max_pets : null,
                'max_matches_per_month' => $request->max_matches ? (int) $request->max_matches : null,
                'max_ai_generations_per_day' => $request->max_ai_generations ? (int) $request->max_ai_generations : null,
            ],
        ]);

        AuditLog::log(
            'subscription_tier.created',
            AuditLog::TYPE_CREATE,
            "Subscription tier '{$tier->name}' created",
            SubscriptionTier::class,
            $tier->id,
            [],
            $tier->toArray()
        );

        return redirect()->route('admin.subscription-tiers.index')
            ->with('success', 'Subscription tier created successfully.');
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
            'max_pets' => 'nullable|integer|min:1',
            'max_matches' => 'nullable|integer|min:1',
            'max_ai_generations' => 'nullable|integer|min:1',
        ]);

        $oldValues = $tier->toArray();

        // Determine is_active: if explicitly sent (toggle form), use it; otherwise keep current
        $isActive = $request->has('is_active') ? (bool) $request->input('is_active') : $tier->is_active;

        $tier->update([
            'name' => $request->name,
            'price' => $request->price,
            'duration_days' => $request->duration_days,
            'is_active' => $isActive,
            'features' => [
                'max_pets' => $request->max_pets ? (int) $request->max_pets : null,
                'max_matches_per_month' => $request->max_matches ? (int) $request->max_matches : null,
                'max_ai_generations_per_day' => $request->max_ai_generations ? (int) $request->max_ai_generations : null,
            ],
        ]);

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

    /**
     * Remove (soft-disable) or permanently delete a subscription tier.
     */
    public function destroy($id)
    {
        $tier = SubscriptionTier::findOrFail($id);
        $tierName = $tier->name;

        AuditLog::log(
            'subscription_tier.deleted',
            AuditLog::TYPE_DELETE,
            "Subscription tier '{$tierName}' deleted",
            SubscriptionTier::class,
            $tier->id,
            $tier->toArray(),
            []
        );

        $tier->delete();

        return redirect()->route('admin.subscription-tiers.index')
            ->with('success', "Subscription tier '{$tierName}' deleted successfully.");
    }
}
