<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class TodoController extends Controller
{
    /**
     * Display a listing of todos.
     */
    public function index(): JsonResponse
    {
        return response()->json(Todo::latest()->get());
    }

    /**
     * Store a newly created todo.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $todo = Todo::create([
            'title' => $validated['title'],
            'completed' => false,
        ]);

        return response()->json($todo, 201);
    }

    /**
     * Update the specified todo.
     */
    public function update(Request $request, Todo $todo): JsonResponse
    {
        $validated = $request->validate([
            'completed' => 'sometimes|boolean',
            'title' => 'sometimes|string|max:255',
        ]);

        $todo->update($validated);

        return response()->json($todo);
    }

    /**
     * Remove the specified todo.
     */
    public function destroy(Todo $todo): Response
    {
        $todo->delete();

        return response()->noContent();
    }
}
