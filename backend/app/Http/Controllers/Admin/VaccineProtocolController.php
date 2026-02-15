<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VaccineProtocol;
use App\Models\ProtocolCategory;
use App\Models\VaccinationShot;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VaccineProtocolController extends Controller
{
    /**
     * Display list of vaccine protocols with filters.
     */
    public function index(Request $request)
    {
        $query = VaccineProtocol::query();

        // Filter by species
        if ($request->filled('species')) {
            $query->where('species', $request->species);
        }

        // Filter by required/optional
        if ($request->filled('status')) {
            if ($request->status === 'required') {
                $query->where('is_required', true);
            } elseif ($request->status === 'optional') {
                $query->where('is_required', false);
            }
        }

        // Filter by active status
        if ($request->filled('active')) {
            $query->where('is_active', (bool) $request->active);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Stats
        $totalProtocols = VaccineProtocol::count();
        $activeProtocols = VaccineProtocol::where('is_active', true)->count();
        $dogProtocols = VaccineProtocol::where('species', 'dog')->count();
        $catProtocols = VaccineProtocol::where('species', 'cat')->count();

        $protocols = $query->ordered()->paginate(15)->appends($request->query());
        $categories = ProtocolCategory::all();

        return view('admin.vaccine-protocols.index', compact(
            'protocols',
            'categories',
            'totalProtocols',
            'activeProtocols',
            'dogProtocols',
            'catProtocols'
        ));
    }

    /**
     * Show create protocol form.
     */
    public function create()
    {
        return view('admin.vaccine-protocols.create');
    }

    /**
     * Store a new vaccine protocol.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'protocol_category_id' => 'nullable|exists:protocol_categories,id',
            'species' => 'required|in:dog,cat,all',
            'is_required' => 'boolean',
            'description' => 'nullable|string|max:1000',
            'protocol_type' => 'required|in:series_only,series_with_booster,recurring',
            'series_doses' => 'nullable|integer|min:1|max:10',
            'series_interval_days' => 'nullable|integer|min:1',
            'booster_interval_days' => 'nullable|integer|min:1',
            'sort_order' => 'integer|min:0',
        ]);

        // Build protocol data based on type
        $data = [
            'name' => $validated['name'],
            'slug' => VaccineProtocol::generateSlug($validated['name']),
            'protocol_category_id' => $validated['protocol_category_id'] ?? null,
            'species' => $validated['species'],
            'is_required' => $validated['is_required'] ?? false,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => true,
        ];

        switch ($validated['protocol_type']) {
            case 'series_only':
                $data['series_doses'] = $validated['series_doses'] ?? 1;
                $data['series_interval_days'] = $validated['series_interval_days'] ?? null;
                $data['has_booster'] = false;
                $data['booster_interval_days'] = null;
                break;

            case 'series_with_booster':
                $data['series_doses'] = $validated['series_doses'] ?? 1;
                $data['series_interval_days'] = $validated['series_interval_days'] ?? null;
                $data['has_booster'] = true;
                $data['booster_interval_days'] = $validated['booster_interval_days'] ?? 365;
                break;

            case 'recurring':
                $data['series_doses'] = null;
                $data['series_interval_days'] = null;
                $data['has_booster'] = true;
                $data['booster_interval_days'] = $validated['booster_interval_days'] ?? 365;
                break;
        }

        $protocol = VaccineProtocol::create($data);

        AuditLog::log(
            'vaccine_protocol.created',
            AuditLog::TYPE_CREATE,
            "Vaccine protocol '{$protocol->name}' created",
            VaccineProtocol::class,
            $protocol->id
        );

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Protocol \"{$protocol->name}\" created successfully.",
                'protocol' => $protocol,
            ], 201);
        }

        return redirect()->route('admin.vaccine-protocols.index')
            ->with('success', "Protocol \"{$protocol->name}\" created successfully.");
    }

    /**
     * Show edit protocol form.
     */
    public function edit($id)
    {
        $protocol = VaccineProtocol::findOrFail($id);
        return view('admin.vaccine-protocols.edit', compact('protocol'));
    }

    /**
     * Update an existing vaccine protocol.
     */
    public function update(Request $request, $id)
    {
        $protocol = VaccineProtocol::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'protocol_category_id' => 'nullable|exists:protocol_categories,id',
            'species' => 'required|in:dog,cat,all',
            'is_required' => 'boolean',
            'description' => 'nullable|string|max:1000',
            'protocol_type' => 'required|in:series_only,series_with_booster,recurring',
            'series_doses' => 'nullable|integer|min:1|max:10',
            'series_interval_days' => 'nullable|integer|min:1',
            'booster_interval_days' => 'nullable|integer|min:1',
            'sort_order' => 'integer|min:0',
        ]);

        $oldValues = $protocol->toArray();

        // Update basic fields
        $protocol->name = $validated['name'];
        $protocol->protocol_category_id = $validated['protocol_category_id'] ?? null;
        $protocol->species = $validated['species'];
        $protocol->is_required = $validated['is_required'] ?? false;
        $protocol->description = $validated['description'] ?? null;
        $protocol->sort_order = $validated['sort_order'] ?? 0;

        // Re-generate slug only if name changed
        if ($protocol->isDirty('name')) {
            $protocol->slug = VaccineProtocol::generateSlug($validated['name']);
        }

        switch ($validated['protocol_type']) {
            case 'series_only':
                $protocol->series_doses = $validated['series_doses'] ?? 1;
                $protocol->series_interval_days = $validated['series_interval_days'] ?? null;
                $protocol->has_booster = false;
                $protocol->booster_interval_days = null;
                break;

            case 'series_with_booster':
                $protocol->series_doses = $validated['series_doses'] ?? 1;
                $protocol->series_interval_days = $validated['series_interval_days'] ?? null;
                $protocol->has_booster = true;
                $protocol->booster_interval_days = $validated['booster_interval_days'] ?? 365;
                break;

            case 'recurring':
                $protocol->series_doses = null;
                $protocol->series_interval_days = null;
                $protocol->has_booster = true;
                $protocol->booster_interval_days = $validated['booster_interval_days'] ?? 365;
                break;
        }

        $protocol->save();

        AuditLog::log(
            'vaccine_protocol.updated',
            AuditLog::TYPE_UPDATE,
            "Vaccine protocol '{$protocol->name}' updated",
            VaccineProtocol::class,
            $protocol->id,
            $oldValues,
            $protocol->toArray()
        );

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Protocol \"{$protocol->name}\" updated successfully.",
                'protocol' => $protocol,
            ]);
        }

        return redirect()->route('admin.vaccine-protocols.index')
            ->with('success', "Protocol \"{$protocol->name}\" updated successfully.");

    }

    /**
     * Toggle protocol active/inactive status.
     */
    public function toggleActive($id)
    {
        $protocol = VaccineProtocol::findOrFail($id);
        $oldStatus = $protocol->is_active;
        $protocol->is_active = !$protocol->is_active;
        $protocol->save();

        $action = $protocol->is_active ? 'activated' : 'deactivated';

        AuditLog::log(
            "vaccine_protocol.{$action}",
            AuditLog::TYPE_UPDATE,
            "Vaccine protocol '{$protocol->name}' {$action}",
            VaccineProtocol::class,
            $protocol->id,
            ['is_active' => $oldStatus],
            ['is_active' => $protocol->is_active]
        );

        return redirect()->route('admin.vaccine-protocols.index')
            ->with('success', "Protocol \"{$protocol->name}\" {$action} successfully.");
    }

    /**
     * Display pending vaccination shots for admin verification.
     */
    public function pendingShots(Request $request)
    {
        $query = VaccinationShot::where('verification_status', 'pending')
            ->with(['card.pet.owner', 'card.protocol'])
            ->orderBy('created_at', 'asc');

        // Filter by species
        if ($request->filled('species')) {
            $query->whereHas('card.pet', function ($q) use ($request) {
                $q->where('species', $request->species);
            });
        }

        // Search by pet name or owner name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('card.pet', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })->orWhereHas('card.pet.owner', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            });
        }

        $pendingShots = $query->paginate(10)->appends($request->query());

        return view('admin.vaccine-protocols.pending-shots', compact('pendingShots'));
    }

    /**
     * Approve a vaccination shot.
     */
    public function approveShot($shotId)
    {
        $shot = VaccinationShot::with('card.pet')->findOrFail($shotId);

        if ($shot->verification_status !== 'pending') {
            return redirect()->back()->with('error', 'This shot has already been processed.');
        }

        $shot->verification_status = VaccinationShot::VERIFICATION_APPROVED;
        $shot->status = VaccinationShot::STATUS_COMPLETED;
        $shot->save();

        // Update the parent card status
        $shot->card->updateStatus();

        $petName = $shot->card->pet->name ?? 'unknown';

        AuditLog::log(
            'vaccination_shot.approved',
            AuditLog::TYPE_VERIFY,
            "Vaccination shot #{$shot->shot_number} approved for pet '{$petName}'",
            VaccinationShot::class,
            $shotId,
            ['verification_status' => 'pending'],
            ['verification_status' => 'approved']
        );

        return redirect()->route('admin.vaccination-shots.pending')
            ->with('success', 'Vaccination shot approved successfully.');
    }

    /**
     * Reject a vaccination shot with reason.
     */
    public function rejectShot(Request $request, $shotId)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $shot = VaccinationShot::with('card.pet')->findOrFail($shotId);

        if ($shot->verification_status !== 'pending') {
            return redirect()->back()->with('error', 'This shot has already been processed.');
        }

        $shot->verification_status = VaccinationShot::VERIFICATION_REJECTED;
        $shot->rejection_reason = $request->rejection_reason;
        $shot->save();

        // Update the parent card status
        $shot->card->updateStatus();

        $petName = $shot->card->pet->name ?? 'unknown';

        AuditLog::log(
            'vaccination_shot.rejected',
            AuditLog::TYPE_REJECT,
            "Vaccination shot #{$shot->shot_number} rejected for pet '{$petName}'",
            VaccinationShot::class,
            $shotId,
            ['verification_status' => 'pending'],
            ['verification_status' => 'rejected', 'rejection_reason' => $request->rejection_reason]
        );

        return redirect()->route('admin.vaccination-shots.pending')
            ->with('success', 'Vaccination shot rejected.');
    }
}
