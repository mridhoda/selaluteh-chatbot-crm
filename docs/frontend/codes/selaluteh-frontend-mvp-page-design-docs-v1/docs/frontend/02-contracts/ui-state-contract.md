# UI State Contract

Each page must explicitly support:

```txt
initial loading
background refresh
success with data
empty resource
empty filtered result
partial data
recoverable error
unauthorized
not found
offline/disconnected dependency
mutation pending
mutation success
mutation failure
```

## Loading

- skeleton over spinner for page/table;
- do not flash empty state before loading resolves;
- retain old data during safe background refresh.

## Error

- concise explanation;
- Retry action;
- preserve filters/form input;
- do not expose raw stack trace.

## Unauthorized

```txt
You do not have access to this outlet or action.
```

Do not silently show empty data for access denied.

## Mutation feedback

- disable duplicate submission;
- show progress state;
- show success toast;
- restore form interaction on failure;
- avoid optimistic updates for payment/security/platform credential operations.

## Last updated

Show only when meaningful. Refresh icon must expose loading state and be accessible.
