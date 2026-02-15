@extends('admin.layouts.app')

@section('title', 'Protocol Categories - KHAT Admin')

@section('content')
<!-- Flash Message -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
    <i data-lucide="check-circle" class="w-5 h-5 text-green-600 flex-shrink-0"></i>
    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
</div>
@endif

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Protocol Categories</h1>
        <p class="text-sm text-gray-500 mt-1">Organize vaccine protocols into categories</p>
    </div>
    <button onclick="openCreateModal()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
        <i data-lucide="plus" class="w-4 h-4"></i>
        Create Category
    </button>
</div>

<!-- Categories Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">Name</th>
                    <th class="px-6 py-4 font-semibold">Description</th>
                    <th class="px-6 py-4 font-semibold text-center">Protocols</th>
                    <th class="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @forelse($categories as $category)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900">{{ $category->name }}</td>
                    <td class="px-6 py-4 text-gray-700 max-w-xs truncate" title="{{ $category->description }}">
                        {{ $category->description ?: '—' }}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {{ $category->protocols_count ?? 0 }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="openEditModal(this)"
                                data-id="{{ $category->id }}"
                                data-name="{{ $category->name }}"
                                data-description="{{ $category->description }}"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                                Edit
                            </button>
                            <form action="{{ route('admin.protocol-categories.destroy', $category->id) }}" method="POST" class="inline" onsubmit="return confirmDelete(event)">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                    Delete
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" class="px-6 py-16 text-center">
                        <div class="flex flex-col items-center gap-3 text-gray-400">
                            <i data-lucide="folder-open" class="w-16 h-16 text-gray-300"></i>
                            <p class="text-base font-medium text-gray-500">No categories found</p>
                            <p class="text-sm text-gray-400">Create a category to organize protocols</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Create Category Modal -->
<div id="createCategoryModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCreateModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Create Category</h2>
                    <p class="text-sm text-gray-500 mt-0.5">Add a new protocol category</p>
                </div>
                <button type="button" onclick="closeCreateModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="createCategoryForm" action="{{ route('admin.protocol-categories.store') }}" method="POST">
                    @csrf
                    <div class="mb-5">
                        <label for="create_name" class="block text-sm font-semibold text-gray-700 mb-2">Name <span class="text-red-500">*</span></label>
                        <input type="text" name="name" id="create_name" required placeholder="e.g., Core Vaccines" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    </div>
                    <div class="mb-5">
                        <label for="create_description" class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea name="description" id="create_description" rows="3" placeholder="Optional description..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition resize-none"></textarea>
                    </div>
                </form>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button type="button" onclick="closeCreateModal()" class="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onclick="document.getElementById('createCategoryForm').submit()" class="px-6 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Create Category
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Edit Category Modal -->
<div id="editCategoryModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeEditModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Edit Category</h2>
                    <p class="text-sm text-gray-500 mt-0.5">Update category details</p>
                </div>
                <button type="button" onclick="closeEditModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="editCategoryForm" method="POST">
                    @csrf
                    @method('PUT')
                    <div class="mb-5">
                        <label for="edit_name" class="block text-sm font-semibold text-gray-700 mb-2">Name <span class="text-red-500">*</span></label>
                        <input type="text" name="name" id="edit_name" required class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    </div>
                    <div class="mb-5">
                        <label for="edit_description" class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea name="description" id="edit_description" rows="3" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition resize-none"></textarea>
                    </div>
                </form>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button type="button" onclick="closeEditModal()" class="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onclick="document.getElementById('editCategoryForm').submit()" class="px-6 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i> Save Changes
                </button>
            </div>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });

    function openCreateModal() {
        document.getElementById('createCategoryModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeCreateModal() {
        document.getElementById('createCategoryModal').classList.add('hidden');
        document.body.style.overflow = '';
    }

    function openEditModal(btn) {
        const modal = document.getElementById('editCategoryModal');
        const form = document.getElementById('editCategoryForm');
        
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const description = btn.getAttribute('data-description');

        form.action = `/admin/protocol-categories/${id}`;
        document.getElementById('edit_name').value = name;
        document.getElementById('edit_description').value = description || '';

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeEditModal() {
        document.getElementById('editCategoryModal').classList.add('hidden');
        document.body.style.overflow = '';
    }

    function confirmDelete(e) {
        e.preventDefault();
        const form = e.target;
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E75234',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    form.submit();
                }
            });
        } else {
            if (confirm('Are you sure you want to delete this category?')) {
                form.submit();
            }
        }
        return false;
    }

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCreateModal();
            closeEditModal();
        }
    });
</script>
@endpush
