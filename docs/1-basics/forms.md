# Forms & Two-Way Binding
> Complete guide to handling user inputs, form synchronization, multi-checkbox arrays, and real-time validation using `kite-model`.

---

## What is `kite-model`?

In standard HTML, form inputs hold internal DOM state that must be manually read through event listeners and synced with JavaScript variables.

The `kite-model` directive creates **two-way data synchronization**:
- When the user types or toggles a form control, the bound scope variable updates immediately.
- When the scope variable changes programmatically, the form control refreshes automatically.

---

## Supported Form Controls

| Form Control | HTML Element | Scope Value Type | Sync Event |
| :--- | :--- | :--- | :--- |
| **Text & Search** | `<input type="text">`, `type="search"` | `string` | `input` |
| **Numeric** | `<input type="number">`, `type="range"` | `number` | `input` |
| **Single Checkbox** | `<input type="checkbox">` | `boolean` (`true` / `false`) | `change` |
| **Checkbox Array** | `<input type="checkbox" value="...">` | `Array<string>` | `change` |
| **Radio Group** | `<input type="radio" value="...">` | `string` | `change` |
| **Textarea** | `<textarea>` | `string` | `input` |
| **Dropdown Select** | `<select>` | `string` | `change` |
| **Multi-Select** | `<select multiple>` | `Array<string>` | `change` |

---

## Control-by-Control Guide

### 1. Text, Password, Email & Search Inputs
```html
<div kite-scope="{ username: '', email: '' }">
  <input type="text" placeholder="Username" kite-model="username">
  <input type="email" placeholder="Email" kite-model="email">

  <p>Live preview: <strong kite-text="username"></strong> (<span kite-text="email"></span>)</p>
</div>
```

---

### 2. Numbers & Ranges
Number inputs automatically parse values into native JavaScript numbers rather than strings:

```html
<div kite-scope="{ quantity: 1, unitPrice: 24.50 }">
  <label>Quantity: <input type="number" min="1" max="100" kite-model="quantity"></label>
  <label>Discount: <input type="range" min="0" max="50" kite-model="discount"></label>

  <p kite-text="'Total: $' + (quantity * unitPrice).toFixed(2)"></p>
</div>
```

---

### 3. Checkboxes (Boolean vs Array)

#### A. Single Boolean Checkbox (Toggles `true` / `false`)
```html
<div kite-scope="{ termsAccepted: false }">
  <label>
    <input type="checkbox" kite-model="termsAccepted">
    I accept the Terms and Conditions
  </label>
  <button kite-bind:disabled="!termsAccepted">Continue</button>
</div>
```

#### B. Multiple Checkboxes (Array of Values)
When multiple checkboxes with `value="..."` share the same `kite-model` array, Kite automatically appends or removes the item from the array:

```html
<div kite-scope="{ selectedToppings: ['cheese'] }">
  <h4>Choose Pizza Toppings:</h4>
  <label><input type="checkbox" value="cheese" kite-model="selectedToppings"> Cheese</label>
  <label><input type="checkbox" value="pepperoni" kite-model="selectedToppings"> Pepperoni</label>
  <label><input type="checkbox" value="mushrooms" kite-model="selectedToppings"> Mushrooms</label>

  <p>Toppings selected: <strong kite-text="selectedToppings.join(', ')"></strong></p>
</div>
```

---

### 4. Radio Buttons
Radio buttons sharing a `kite-model` update the variable to the selected button's `value`:

```html
<div kite-scope="{ plan: 'monthly' }">
  <label><input type="radio" name="billing" value="monthly" kite-model="plan"> Monthly ($10/mo)</label>
  <label><input type="radio" name="billing" value="annual" kite-model="plan"> Annual ($96/yr - Save 20%)</label>

  <p kite-text="'Selected plan: ' + plan"></p>
</div>
```

---

### 5. Select Dropdowns (Single and Multiple)
```html
<div kite-scope="{ country: 'US', skills: ['js'] }">
  <!-- Single Select -->
  <select kite-model="country">
    <option value="US">United States</option>
    <option value="CA">Canada</option>
    <option value="UK">United Kingdom</option>
  </select>

  <!-- Multiple Select -->
  <select multiple kite-model="skills">
    <option value="html">HTML5</option>
    <option value="css">CSS3</option>
    <option value="js">JavaScript</option>
  </select>
</div>
```

---

---

## Form Validation & Submissions

Kite provides two complementary approaches to validation:
1. **Declarative Validation Engine (`kite-validate`)**: Automatically tracks form validity and generates error messages.
2. **Expression Validation**: Ad-hoc checks using `kite-show` and condition logic.

### 1. The Declarative Validation Engine (`kite-validate`)

Add `kite-validate` to your `<form>` element. Kite will automatically inspect all child input elements, evaluate validation constraints, and populate a reactive `form` state object on the scope:

```html
<form kite-validate kite-on-submit.prevent="submitData()">
  <!-- Field with built-in validation rules -->
  <div class="form-group">
    <label>Email</label>
    <input type="email" name="email" kite-model="email" kite-required kite-pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$">
    <!-- Automatically displays error for 'email' -->
    <span class="error" kite-error="email"></span>
  </div>

  <div class="form-group">
    <label>Age (18-99)</label>
    <input type="number" name="age" kite-model.number="age" kite-min="18" kite-max="99">
    <span class="error" kite-error="age"></span>
  </div>

  <!-- Submit button disabled when form is invalid -->
  <button type="submit" kite-bind:disabled="!form.valid">Submit</button>
</form>
```

### Supported Validation Attributes:

| Attribute | Behavior |
| :--- | :--- |
| `kite-validate` | Container directive placed on `<form>` or wrapping `<div>` to activate validation. |
| `kite-required` | Fails if the input value is empty or whitespace only. |
| `kite-pattern="regex"` | Validates against a regular expression pattern. |
| `kite-min="n"` | Sets minimum numeric value for numbers, or minimum character length for text. |
| `kite-max="n"` | Sets maximum numeric value for numbers, or maximum character length for text. |
| `kite-rule="ruleName"` | Executes a custom validation rule registered via `Kite.rule()`. |
| `kite-error="fieldName"` | Automatically displays the validation error text for the named field. |

### The Reactive `form` State Object
When `kite-validate` is active, Kite automatically creates and updates `scope.form`:
- `form.valid` (*boolean*): `true` if all fields pass validation; `false` otherwise.
- `form.dirty` (*boolean*): `true` if any input field has been modified by the user.
- `form.validating` (*boolean*): `true` while asynchronous validation rules are pending.
- `form.errors` (*Record<string, string>*): Map of field name to current error message string.

### Custom Validation Rules (`Kite.rule`)
Register reusable custom synchronous or asynchronous validation rules:

```javascript
// Sync rule
Kite.rule('strong-password', (value) => {
  if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Must contain at least one number.';
  return true; // valid
});

// Async rule (e.g. check username availability)
Kite.rule('available-username', async (username) => {
  const isAvailable = await checkServer(username);
  return isAvailable ? true : 'Username is already taken.';
});
```

Attach to inputs via `kite-rule`:
```html
<input type="password" name="pwd" kite-model="password" kite-rule="strong-password">
<span kite-error="pwd"></span>
```

---

### 2. Form Submission with `.prevent`
Always use `kite-on-submit.prevent` on `<form>` tags to stop standard browser page reloads:

```html
<form kite-on-submit.prevent="handleSubmit()">
  ...
</form>
```

---

## Complete Example: Real-Time User Registration

Here is a complete, working registration form with real-time password confirmation, email verification, and conditional error messages:

```html
<div class="form-container" kite-scope="{
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  submitted: false
}">

  <!-- Success Notification -->
  <div class="alert-success" kite-show="submitted">
    <h3>Account Created Successfully!</h3>
    <p>Welcome, <span kite-text="name"></span>. A confirmation email has been sent to <span kite-text="email"></span>.</p>
    <button kite-on-click="submitted = false; name = ''; email = ''; password = ''; confirmPassword = ''">
      Register Another Account
    </button>
  </div>

  <!-- Registration Form -->
  <form kite-show="!submitted" kite-on-submit.prevent="submitted = true">
    <h2>Create Your Account</h2>

    <!-- Name Field -->
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" placeholder="Ada Lovelace" kite-model="name" required>
    </div>

    <!-- Email Field with instant domain hint -->
    <div class="form-group">
      <label>Email Address</label>
      <input type="email" placeholder="ada@example.com" kite-model="email" required>
      <small class="error" kite-show="email.length > 0 && !email.includes('@')">
        Please enter a valid email address.
      </small>
    </div>

    <!-- Password Field -->
    <div class="form-group">
      <label>Password (min 8 chars)</label>
      <input type="password" kite-model="password" required>
      <small class="error" kite-show="password.length > 0 && password.length < 8">
        Password must be at least 8 characters long.
      </small>
    </div>

    <!-- Confirm Password Field -->
    <div class="form-group">
      <label>Confirm Password</label>
      <input type="password" kite-model="confirmPassword" required>
      <small class="error" kite-show="confirmPassword.length > 0 && confirmPassword !== password">
        Passwords do not match.
      </small>
    </div>

    <!-- Submit Button (dynamically disabled until valid) -->
    <button
      type="submit"
      kite-bind:disabled="!name.trim() || !email.includes('@') || password.length < 8 || password !== confirmPassword"
    >
      Create Account
    </button>
  </form>

</div>
```

---

## Gotchas & Best Practices

> [!TIP]
> **Use `.trim()` on Text Inputs**: When checking if a user has entered text, use `name.trim()` to ignore trailing or leading spaces:
> ```html
> <button kite-bind:disabled="!name.trim()">Submit</button>
> ```

> [!NOTE]
> **Native HTML5 Validation Works**: Kite works alongside standard browser validation attributes (`required`, `minlength`, `pattern`, `type="email"`). Forms submit only when valid.

---

## Related Documentation
- [Directives Reference](./directives.md)
- [Declarative Components](../2-architecture/components.md)
- [Safe Expressions & Security Engine](../3-internals/expressions.md)
