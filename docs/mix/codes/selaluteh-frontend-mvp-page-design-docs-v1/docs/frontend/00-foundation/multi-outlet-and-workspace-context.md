# Multi-Outlet and Workspace Context

## Architecture decision

```txt
MVP:
1 workspace/account Selalu Teh
└── many outlets

Future:
many workspaces/accounts/franchise owners
└── many outlets per workspace
```

## Core rule

```txt
workspace_id = pemilik/account bisnis/franchise owner
outlet_id    = cabang operasional
```

Frontend tidak boleh mencampur keduanya.

## Global state

Gunakan state global yang sudah disiapkan:

```txt
web/src/stores/workspaceStore.js
web/src/stores/outletStore.js
```

State minimum:

```js
{
  currentWorkspace,
  availableWorkspaces,
  currentOutlet,
  availableOutlets,
  outletAccessMode: 'all' | 'restricted' | 'single'
}
```

## All Outlets behavior

`All Outlets` hanya tersedia ketika user memiliki akses ke lebih dari satu outlet dan role-nya mengizinkan aggregate view.

### Owner / Super Admin

- dapat memilih `All Outlets`;
- dapat melihat aggregate metrics;
- dapat mengubah outlet filter;
- dapat membuat product workspace-level dan mengatur availability per outlet.

### Outlet Manager / Human Agent terbatas

- hanya melihat outlet yang diizinkan;
- jika akses hanya satu outlet, selector disembunyikan atau locked;
- query tetap mengirim outlet context yang diizinkan;
- UI tidak boleh menyediakan cara untuk mengakses outlet lain hanya dengan mengubah URL/query param.

## Page behavior

### Products

- `All Outlets` berarti catalog workspace + availability across outlets.
- Outlet spesifik berarti tampilkan availability, price override, dan stock/availability outlet tersebut.

### Payments

- `All Outlets` berarti aggregate transaction view.
- Outlet spesifik memfilter payment berdasarkan order outlet.

### Chat

- chat harus menyimpan platform dan outlet context.
- chat tanpa outlet context harus diberi label `Outlet not selected` atau `Unassigned`.
- active order/cart menentukan outlet context yang tidak boleh berubah diam-diam.

### Settings

- workspace settings berbeda dari outlet settings.
- gunakan tab/subsection yang eksplisit.

### Connected Platforms

- platform secara default workspace-level.
- outlet routing dapat dikonfigurasi terpisah jika diperlukan.
- jangan menganggap satu token Telegram sama dengan satu outlet kecuali business rule memang memutuskan begitu.
