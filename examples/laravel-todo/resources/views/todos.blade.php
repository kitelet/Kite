{{-- resources/views/todos.blade.php --}}
@extends('layouts.app')

@section('content')
<div class="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <h1 class="text-2xl font-bold text-slate-900 mb-2">My Tasks</h1>
    <p class="text-sm text-slate-500 mb-6">Built with Laravel 11, Blade, Eloquent, and Kite reactivity.</p>

    <!-- Configure Kite API client with Laravel CSRF header -->
    <kite-api name="main" base="/api">
        <kite-header name="X-CSRF-TOKEN" value="{{ csrf_token() }}"></kite-header>
    </kite-api>

    <!-- Kite Model with Async CRUD operations calling Laravel API -->
    <kite-model name="todos" api="main">
        {
            items: [],
            draft: "",
            async load() {
                this.items = await this.api.get('/todos');
            },
            async add() {
                if (!this.draft.trim()) return;
                const newTodo = await this.api.post('/todos', { title: this.draft });
                this.items.push(newTodo);
                this.draft = "";
            },
            async toggle(item) {
                item.completed = !item.completed;
                await this.api.patch('/todos/' + item.id, { completed: item.completed });
            },
            async remove(id) {
                await this.api.delete('/todos/' + id);
                this.items = this.items.filter(t => t.id !== id);
            }
        }
    </kite-model>

    <!-- Inline View connected to todos model -->
    <kite-view model="todos" kite-on-mount="load()">
        <form class="flex gap-2 mb-6" kite-on-submit.prevent="add()">
            <input class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   kite-model="draft"
                   placeholder="What needs to be done?"
                   required>
            <button class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-sm"
                    type="submit">
                Add
            </button>
        </form>

        <ul class="space-y-2">
            <li class="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                kite-for="item in items">
                <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                           class="w-4 h-4 text-indigo-600 rounded"
                           kite-bind:checked="item.completed"
                           kite-on-change="toggle(item)">
                    <span class="text-sm font-medium"
                          kite-class:line-through="item.completed"
                          kite-class:text-slate-400="item.completed"
                          kite-text="item.title"></span>
                </label>
                <button class="text-slate-400 hover:text-red-500 text-sm font-bold px-2 py-1"
                        type="button"
                        kite-on-click="remove(item.id)">
                    ✕
                </button>
            </li>
        </ul>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span><strong kite-text="items.length">0</strong> total items</span>
            <button class="hover:text-indigo-600 font-medium"
                    type="button"
                    kite-on-click="load()">
                Refresh list
            </button>
        </div>
    </kite-view>
</div>
@endsection
