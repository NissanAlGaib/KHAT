<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProtocolCategory;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProtocolCategoryController extends Controller
{
    /**
     * Display a listing of the protocol categories.
     */
    public function index()
    {
        $categories = ProtocolCategory::all();
        return view('admin.protocol-categories.index', compact('categories'));
    }

    /**
     * Store a newly created protocol category in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:protocol_categories,name',
            'description' => 'nullable|string|max:500',
        ]);

        $category = ProtocolCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        AuditLog::log(
            'protocol_category.created',
            AuditLog::TYPE_CREATE,
            "Protocol category '{$category->name}' created",
            ProtocolCategory::class,
            $category->id
        );

        return redirect()->route('admin.protocol-categories.index')
            ->with('success', 'Protocol category created successfully.');
    }

    /**
     * Update the specified protocol category in storage.
     */
    public function update(Request $request, $id)
    {
        $category = ProtocolCategory::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:protocol_categories,name,' . $id,
            'description' => 'nullable|string|max:500',
        ]);

        $oldValues = $category->toArray();
        
        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        AuditLog::log(
            'protocol_category.updated',
            AuditLog::TYPE_UPDATE,
            "Protocol category '{$category->name}' updated",
            ProtocolCategory::class,
            $category->id,
            $oldValues,
            $category->toArray()
        );

        return redirect()->route('admin.protocol-categories.index')
            ->with('success', 'Protocol category updated successfully.');
    }

    /**
     * Remove the specified protocol category from storage.
     */
    public function destroy($id)
    {
        $category = ProtocolCategory::findOrFail($id);
        $categoryName = $category->name;
        
        // Check if there are any protocols using this category
        if ($category->protocols()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete category that has protocols.');
        }

        $category->delete();

        AuditLog::log(
            'protocol_category.deleted',
            AuditLog::TYPE_DELETE,
            "Protocol category '{$categoryName}' deleted",
            ProtocolCategory::class,
            $id
        );

        return redirect()->route('admin.protocol-categories.index')
            ->with('success', 'Protocol category deleted successfully.');
    }
}
