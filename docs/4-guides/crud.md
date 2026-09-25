# Full CRUD Guide in Kite

> **HTML is enough for small things — and managing data is the heart of every web app.**

CRUD (**Create, Read, Update, Delete**) is the foundational pattern of web applications. In Kite, CRUD requires no heavy state containers, no Redux boilerplate, and no build pipeline.

This guide demonstrates:

1. **Local Reactive CRUD** — In-memory state with Proxy reactivity
2. **REST API CRUD** — Declarative client with `GET`, `POST`, `PUT`, `DELETE`
3. **Form Modeling & Editing State** — Clean two-way bindings without race conditions

---

## 1. The Core CRUD Operations in Kite

| Operation  | HTML Directive / API                                                    | Reactive Effect                                |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| **Create** | `items.push(newItem)` or `Kite.api('users').post('/users', draft)`      | Proxy intercepts append, renders new DOM node  |
| **Read**   | `kite-for="item in items"`, `kite-text="item.name"`                     | Binds element to reactive item properties      |
| **Update** | `item.name = newName` or `Kite.api('users').put('/users/' + id, draft)` | Fine-grained DOM patch targeting modified node |
| **Delete** | `items.splice(index, 1)` or `Kite.api('users').delete('/users/' + id)`  | Removes element and cleans up active reactors  |

---

## 2. In-Memory CRUD Example

A complete, standalone pattern using `kite-scope`:

```html
<div
  class="user-manager"
  kite-scope="{
  users: [
    { id: 1, name: 'Ada Lovelace', role: 'Architect' },
    { id: 2, name: 'Alan Turing', role: 'Cryptanalyst' }
  ],
  draft: { name: '', role: '' },
  editId: null,

  // CREATE
  create() {
    if (!this.draft.name.trim()) return;
    const nextId = this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
    this.users.push({ id: nextId, ...this.draft });
    this.draft = { name: '', role: '' };
  },

  // PREPARE UPDATE
  edit(user) {
    this.editId = user.id;
    this.draft = { name: user.name, role: user.role };
  },

  // COMMIT UPDATE
  save() {
    const idx = this.users.findIndex(u => u.id === this.editId);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...this.draft };
    }
    this.cancel();
  },

  cancel() {
    this.editId = null;
    this.draft = { name: '', role: '' };
  },

  // DELETE
  remove(id) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) this.users.splice(idx, 1);
  }
}"
>
  <!-- Form for Create & Update -->
  <form kite-on-submit.prevent="editId ? save() : create()">
    <input kite-model="draft.name" placeholder="Name" required />
    <input kite-model="draft.role" placeholder="Role" required />
    <button
      type="submit"
      kite-text="editId ? 'Save Changes' : 'Add User'"
    ></button>
    <button type="button" kite-if="editId" kite-on-click="cancel()">
      Cancel
    </button>
  </form>

  <!-- List / Read -->
  <ul>
    <li kite-for="u in users">
      <span kite-text="u.name"></span> — <span kite-text="u.role"></span>
      <button type="button" kite-on-click="edit(u)">Edit</button>
      <button type="button" kite-on-click="remove(u.id)">Delete</button>
    </li>
  </ul>
</div>
```

---

## 3. Remote REST API CRUD with `<kite-api>`

When persisting to a backend (Laravel, Node, Go, Rails, Python), use Kite's built-in REST client:

```html
<!-- 1. Define API Endpoint -->
<kite-api name="usersApi" base="/api/v1">
  <kite-header name="Accept" value="application/json"></kite-header>
</kite-api>

<!-- 2. Bind Model to API -->
<kite-model name="usersModel" api="usersApi">
  { items: [], loading: false, error: null, // READ (GET) async loadAll() {
  this.items = await this.api.get('/users'); }, // CREATE (POST) async
  create(userData) { const created = await this.api.post('/users', userData);
  this.items.push(created); }, // UPDATE (PUT or PATCH) async update(id,
  changes) { const updated = await this.api.put('/users/' + id, changes); const
  idx = this.items.findIndex(u => u.id === id); if (idx !== -1) this.items[idx]
  = updated; }, // DELETE (DELETE) async remove(id) { await
  this.api.delete('/users/' + id); const idx = this.items.findIndex(u => u.id
  === id); if (idx !== -1) this.items.splice(idx, 1); } }
</kite-model>
```

---

## 4. Best Practices for CRUD in Kite

1. **Keep Draft State Separate**: Avoid editing row objects directly until the user confirms or submits the form. Use a `draft` object to prevent accidental premature mutations.
2. **Use ID-based Lookups**: When deleting or updating, look up items using `.findIndex(u => u.id === targetId)` instead of passing raw array indices, especially when the list is filtered.
3. **Handle Empty States**: Pair `kite-for` with a `kite-if="items.length === 0"` notification so users receive immediate feedback when no records exist.
4. **Live Example**: Check out [examples/basics/crud.html](../../examples/basics/crud.html) for a complete working implementation.
