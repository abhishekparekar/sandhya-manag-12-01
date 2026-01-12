# 🎨 CSS Classes Quick Reference Guide

## Buttons

### Base Buttons
```html
<button class="btn">Default Button</button>
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>
<button class="btn btn-ghost">Ghost Button</button>
```

### Button Sizes
```html
<button class="btn btn-sm">Small (40px)</button>
<button class="btn">Default (48px)</button>
<button class="btn btn-lg">Large (56px)</button>
<button class="btn btn-xl">Extra Large (64px)</button>
```

### Icon Buttons
```html
<button class="btn btn-icon"><FiPlus /></button>
<button class="btn btn-icon btn-icon-sm"><FiEdit /></button>
<button class="btn btn-icon btn-icon-lg"><FiTrash /></button>
```

### Button States
```html
<button class="btn btn-primary" disabled>Disabled</button>
<button class="btn btn-primary btn-loading">Loading...</button>
<button class="btn btn-enhanced ripple">With Ripple</button>
```

---

## Forms

### Input Fields
```html
<div class="form-group">
  <label class="form-label">Label</label>
  <input type="text" class="form-input" placeholder="Placeholder" />
  <span class="form-hint">Help text</span>
  <span class="form-error">Error message</span>
</div>
```

### Select Dropdown
```html
<select class="form-select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Textarea
```html
<textarea class="form-textarea" placeholder="Enter text..."></textarea>
```

### Checkbox & Radio
```html
<input type="checkbox" class="form-checkbox" />
<input type="radio" class="form-radio" />
```

---

## Cards

### Basic Cards
```html
<div class="card">Basic Card</div>
<div class="card card-compact">Compact Padding</div>
<div class="card card-comfortable">Comfortable Padding</div>
```

### Interactive Cards
```html
<div class="card card-interactive">Hover to lift</div>
<div class="card hover-lift">Custom hover lift</div>
<div class="card hover-glow">Glow on hover</div>
```

### Special Cards
```html
<div class="glass-card">Glassmorphism effect</div>
<div class="glass-modal">Modal with blur</div>
```

---

## Avatars

```html
<div class="avatar">JD</div>
<div class="avatar avatar-sm">SM</div>
<div class="avatar avatar-lg">LG</div>
<div class="avatar avatar-xl">XL</div>
```

---

## Chips/Tags

```html
<span class="chip">Default</span>
<span class="chip chip-primary">Primary</span>
<span class="chip chip-success">Success</span>
<span class="chip chip-warning">Warning</span>
<span class="chip chip-error">Error</span>
```

---

## Badges

```html
<span class="badge">Default</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
```

---

## Loading States

### Spinner
```html
<div class="spinner"></div>
<div class="spinner spinner-sm"></div>
<div class="spinner spinner-lg"></div>
```

### Skeleton Loader
```html
<div class="skeleton" style="height: 20px; width: 100%;"></div>
```

### Shimmer Effect
```html
<div class="shimmer">
  <img src="..." alt="..." />
</div>
```

---

## Progress Bar

```html
<div class="progress-bar">
  <div class="progress-bar-fill" style="width: 75%;"></div>
</div>
```

---

## Dividers

```html
<div class="divider"></div>
<div class="divider-vertical"></div>
```

---

## Tooltips

```html
<button class="tooltip" data-tooltip="Tooltip text">
  Hover me
</button>
```

---

## Animations

### Fade Animations
```html
<div class="animate-fade-in">Fade in</div>
<div class="animate-slide-up">Slide up</div>
<div class="animate-slide-down">Slide down</div>
<div class="animate-scale-in">Scale in</div>
```

### Micro Animations
```html
<div class="animate-bounce-subtle">Subtle bounce</div>
<div class="pulse-ring">Pulsing ring</div>
<div class="shimmer">Shimmer effect</div>
```

### Staggered Lists
```html
<div class="stagger-item">Item 1</div>
<div class="stagger-item">Item 2</div>
<div class="stagger-item">Item 3</div>
```

---

## Grid Layouts

### Responsive Grids
```html
<div class="grid-mobile-1">
  <!-- 1 col mobile, 2 tablet, 3 desktop -->
</div>

<div class="grid-mobile-2">
  <!-- 2 col mobile, 3 tablet, 4 desktop -->
</div>

<div class="grid-responsive">
  <!-- Fully responsive -->
</div>
```

---

## Touch Targets

```html
<button class="touch-target">48px minimum</button>
<button class="touch-target-comfortable">56px comfortable</button>
<button class="touch-area-extended">Extended tap area</button>
```

---

## Scrollbars

```html
<div class="custom-scrollbar">Subtle scrollbar</div>
<div class="custom-scrollbar-enhanced">Branded scrollbar</div>
<div class="scrollbar-hide">Hidden scrollbar</div>
```

---

## Text Utilities

### Text Clamp
```html
<p class="text-clamp-1">Single line with ellipsis</p>
<p class="text-clamp-2">Two lines max</p>
<p class="text-clamp-3">Three lines max</p>
```

---

## Spacing

### Responsive Spacing
```html
<div class="space-y-mobile">
  <!-- Vertical spacing that adapts -->
</div>
```

---

## Safe Areas (for notched devices)

```html
<div class="safe-area-top">Top padding</div>
<div class="safe-area-bottom">Bottom padding</div>
<div class="safe-area-left">Left padding</div>
<div class="safe-area-right">Right padding</div>
<div class="safe-area-inset">All sides</div>
```

---

## Mobile Specific

### Visibility
```html
<div class="mobile-hide">Hidden on mobile</div>
<div class="mobile-only">Visible only on mobile</div>
```

### Layout
```html
<div class="flex-mobile-stack">Stacks on mobile</div>
<div class="card-mobile-full">Full width on mobile</div>
<div class="mobile-bottom-nav-spacing">Space for bottom nav</div>
```

---

## Performance

```html
<div class="gpu-accelerated">Hardware accelerated</div>
<div class="smooth-scroll">Smooth scrolling</div>
```

---

## Accessibility

```html
<div class="sr-only">Screen reader only</div>
<button class="focus-ring">Focus visible</button>
<div class="no-select">Prevent text selection</div>
```

---

## Sticky Elements

```html
<div class="sticky-header">Sticky header</div>
```

---

## Backdrop

```html
<div class="backdrop-blur-mobile">Blurred backdrop</div>
```

---

## Notification Badge

```html
<div class="relative">
  <FiBell />
  <span class="notification-badge">3</span>
</div>
```

---

## Gradient Backgrounds

```html
<div class="gradient-primary">Primary gradient</div>
<div class="gradient-secondary">Secondary gradient</div>
```

---

## Glass Effect

```html
<div class="glass-effect">Glassmorphism</div>
```

---

## Ripple Effect

```html
<button class="ripple">Material ripple</button>
```

---

## Print Utilities

```html
<div class="no-print">Hidden when printing</div>
```

---

## Combining Classes

### Example: Professional Button
```html
<button class="btn btn-primary btn-lg ripple hover-glow">
  Click Me
</button>
```

### Example: Interactive Card
```html
<div class="card card-comfortable card-interactive hover-lift animate-fade-in">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Example: Form with Validation
```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input form-input-enhanced" />
  <span class="form-error">
    <FiAlertCircle /> Invalid email
  </span>
</div>
```

### Example: Mobile-Optimized Grid
```html
<div class="grid-mobile-2 gap-4">
  <div class="card card-interactive stagger-item">1</div>
  <div class="card card-interactive stagger-item">2</div>
  <div class="card card-interactive stagger-item">3</div>
  <div class="card card-interactive stagger-item">4</div>
</div>
```

---

## Color Classes (Tailwind)

Use Tailwind's color utilities alongside custom classes:
```html
<div class="bg-white text-gray-800 border border-gray-200">
  Content
</div>
```

---

## Responsive Modifiers (Tailwind)

```html
<div class="p-3 sm:p-4 md:p-6 lg:p-8">
  Responsive padding
</div>

<div class="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

---

## Tips

1. **Combine classes** for powerful effects
2. **Use responsive modifiers** (sm:, md:, lg:)
3. **Touch targets** should be 48px minimum
4. **Animations** should be subtle and fast
5. **Test on real devices** for best results

---

**Happy Styling! 🎨**
