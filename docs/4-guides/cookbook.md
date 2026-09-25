# Kite Cookbook & Real-World Recipes

> Battle-tested, copy-pasteable patterns for common web UI requirements. Zero build tools required.

---

## Recipe Index

1. [Searchable & Filterable List](#1-searchable--filterable-list)
2. [Tabbed Interface](#2-tabbed-interface)
3. [Accordion / Collapsible FAQ](#3-accordion--collapsible-faq)
4. [Modal Dialog with Backdrop & Escape Close](#4-modal-dialog-with-backdrop--escape-close)
5. [Shopping Cart with Live Calculations](#5-shopping-cart-with-live-calculations)
6. [Toast Notification System](#6-toast-notification-system)
7. [Multi-Step Wizard Form](#7-multi-step-wizard-form)
8. [Dark Mode Toggle with Persistence](#8-dark-mode-toggle-with-persistence)

---

## 1. Searchable & Filterable List

A real-time search filter with case-insensitive matching and an empty state indicator:

```html
<div
  class="search-widget"
  kite-scope="{
  query: '',
  items: [
    { id: 1, name: 'JavaScript: The Good Parts', category: 'Books' },
    { id: 2, name: 'Mechanical Keyboard', category: 'Hardware' },
    { id: 3, name: 'Noise Cancelling Headphones', category: 'Audio' },
    { id: 4, name: 'Clean Code', category: 'Books' }
  ]
}"
>
  <input type="text" placeholder="Search items..." kite-model="query" />

  <p
    kite-if="items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).length === 0"
  >
    No matching results for "<span kite-text="query"></span>".
  </p>

  <ul kite-else>
    <li
      kite-for="item in items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))"
    >
      <strong kite-text="item.name"></strong>
      (<span kite-text="item.category"></span>)
    </li>
  </ul>
</div>
```

---

## 2. Tabbed Interface

Switch between content panels using simple state toggles:

```html
<div class="tabs-widget" kite-scope="{ activeTab: 'overview' }">
  <div class="tab-buttons">
    <button
      kite-class:active="activeTab === 'overview'"
      kite-on-click="activeTab = 'overview'"
    >
      Overview
    </button>

    <button
      kite-class:active="activeTab === 'specs'"
      kite-on-click="activeTab = 'specs'"
    >
      Specifications
    </button>

    <button
      kite-class:active="activeTab === 'reviews'"
      kite-on-click="activeTab = 'reviews'"
    >
      Reviews
    </button>
  </div>

  <div class="tab-panels">
    <div class="panel" kite-show="activeTab === 'overview'">
      <h3>Product Overview</h3>
      <p>High quality build designed for everyday productivity.</p>
    </div>

    <div class="panel" kite-show="activeTab === 'specs'">
      <h3>Technical Specifications</h3>
      <p>Weight: 450g · Battery: 40h · Bluetooth 5.2</p>
    </div>

    <div class="panel" kite-show="activeTab === 'reviews'">
      <h3>Customer Reviews</h3>
      <p>★★★★★ 4.8 / 5 based on 124 reviews.</p>
    </div>
  </div>
</div>
```

---

## 3. Accordion / Collapsible FAQ

An accordion where expanding an item automatically collapses other items:

```html
<div class="faq-accordion" kite-scope="{ openItem: null }">
  <!-- FAQ Item 1 -->
  <div class="faq-item">
    <button
      class="faq-question"
      kite-on-click="openItem = openItem === 1 ? null : 1"
    >
      What is Kite?
      <span kite-text="openItem === 1 ? '−' : '+'"></span>
    </button>
    <div class="faq-answer" kite-show="openItem === 1">
      <p>
        Kite is a zero-boilerplate reactive toolkit that runs in your HTML
        without a build step.
      </p>
    </div>
  </div>

  <!-- FAQ Item 2 -->
  <div class="faq-item">
    <button
      class="faq-question"
      kite-on-click="openItem = openItem === 2 ? null : 2"
    >
      Does it require Node.js or Webpack?
      <span kite-text="openItem === 2 ? '−' : '+'"></span>
    </button>
    <div class="faq-answer" kite-show="openItem === 2">
      <p>
        No! One script tag is all you need. You can use it directly via CDN or
        self-host a single JS file.
      </p>
    </div>
  </div>
</div>
```

---

## 4. Modal Dialog with Backdrop & Escape Close

A modal dialog that can be dismissed by clicking the backdrop or pressing the Escape key:

```html
<div kite-scope="{ isModalOpen: false }">
  <button kite-on-click="isModalOpen = true">Open Confirmation Modal</button>

  <!-- Modal Overlay (Listens for Escape key) -->
  <div
    class="modal-backdrop"
    kite-show="isModalOpen"
    kite-on-keydown.escape="isModalOpen = false"
  >
    <div class="modal-card">
      <h3>Confirm Your Action</h3>
      <p>Are you sure you want to proceed with this operation?</p>

      <div class="actions">
        <button kite-on-click="isModalOpen = false">Cancel</button>
        <button
          class="btn-primary"
          kite-on-click="alert('Confirmed!'); isModalOpen = false"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 5. Shopping Cart with Live Calculations

A dynamic cart calculating subtotal, tax, and order total in real time:

```html
<div
  class="cart-container"
  kite-scope="{
  taxRate: 0.08,
  shipping: 5.00,
  items: [
    { name: 'Kite T-Shirt', price: 25.00, qty: 1 },
    { name: 'Developer Mug', price: 15.00, qty: 2 }
  ],
  subtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
}"
>
  <h2>Your Order</h2>

  <table>
    <tr kite-for="(item, index) in items">
      <td kite-text="item.name"></td>
      <td>
        <input type="number" min="1" max="10" kite-model="item.qty" />
      </td>
      <td kite-text="'$' + (item.price * item.qty).toFixed(2)"></td>
      <td>
        <button kite-on-click="items.splice(index, 1)">✕</button>
      </td>
    </tr>
  </table>

  <div class="summary">
    <p>Subtotal: $<span kite-text="subtotal().toFixed(2)"></span></p>
    <p>
      Estimated Tax: $<span
        kite-text="(subtotal() * taxRate).toFixed(2)"
      ></span>
    </p>
    <p>Shipping: $<span kite-text="shipping.toFixed(2)"></span></p>
    <h3>
      Total: $<span
        kite-text="(subtotal() * (1 + taxRate) + shipping).toFixed(2)"
      ></span>
    </h3>
  </div>
</div>
```

---

## 6. Toast Notification System

Show transient alerts that can be dismissed manually:

```html
<div
  class="toast-app"
  kite-scope="{
  toasts: [],
  notify(msg) {
    this.toasts.push({ id: Date.now(), text: msg });
  }
}"
>
  <button kite-on-click="notify('Action completed successfully!')">
    Trigger Toast
  </button>

  <div class="toast-container">
    <div class="toast-card" kite-for="(toast, idx) in toasts">
      <span kite-text="toast.text"></span>
      <button kite-on-click="toasts.splice(idx, 1)">✕</button>
    </div>
  </div>
</div>
```

---

## 7. Multi-Step Wizard Form

A sequential checkout wizard with Next, Previous, and Step indicators:

```html
<div
  class="wizard"
  kite-scope="{
  step: 1,
  formData: { name: '', email: '', plan: 'pro' }
}"
>
  <div class="progress">Step <span kite-text="step"></span> of 3</div>

  <!-- Step 1: Personal Info -->
  <div class="step-panel" kite-show="step === 1">
    <h3>Step 1: Your Info</h3>
    <input type="text" placeholder="Full Name" kite-model="formData.name" />
    <button kite-bind:disabled="!formData.name" kite-on-click="step = 2">
      Next →
    </button>
  </div>

  <!-- Step 2: Plan Selection -->
  <div class="step-panel" kite-show="step === 2">
    <h3>Step 2: Choose Plan</h3>
    <select kite-model="formData.plan">
      <option value="basic">Basic ($5/mo)</option>
      <option value="pro">Pro ($15/mo)</option>
      <option value="enterprise">Enterprise ($49/mo)</option>
    </select>
    <button kite-on-click="step = 1">← Back</button>
    <button kite-on-click="step = 3">Next →</button>
  </div>

  <!-- Step 3: Confirmation -->
  <div class="step-panel" kite-show="step === 3">
    <h3>Step 3: Review & Confirm</h3>
    <p>Name: <strong kite-text="formData.name"></strong></p>
    <p>Plan: <strong kite-text="formData.plan"></strong></p>
    <button kite-on-click="step = 2">← Back</button>
    <button class="btn-submit" kite-on-click="alert('Order Placed!'); step = 1">
      Confirm & Pay
    </button>
  </div>
</div>
```

---

## 8. Dark Mode Toggle with Persistence

Persist user theme preference to `localStorage` using a custom directive:

```html
<script type="module">
  import Kite from "https://esm.sh/@kitelet/core";

  // Register custom persistence directive
  Kite.directive("persist-theme", (el, expr, scope) => {
    const saved = localStorage.getItem("app_theme");
    if (saved) scope[expr] = saved;

    return scope.$subscribe(expr, (val) => {
      localStorage.setItem("app_theme", val);
      document.documentElement.setAttribute("data-theme", val);
    });
  });
</script>

<div kite-scope="{ theme: 'light' }" kite-persist-theme="theme">
  <button kite-on-click="theme = theme === 'light' ? 'dark' : 'light'">
    Switch to
    <span kite-text="theme === 'light' ? 'Dark' : 'Light'"></span> Mode
  </button>
</div>
```

---

## Related Documentation

- [Directives Reference](../1-basics/directives.md)
- [Forms & Two-Way Binding](../1-basics/forms.md)
- [Declarative Components](../2-architecture/components.md)
