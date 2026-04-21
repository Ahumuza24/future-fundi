# PIXEL TRACK — Coding Agent Rules
### Rules the AI coding agent must follow at all times when building this project

---

## RULE 0 — Read This First

These rules are non-negotiable. They apply to every file, every function, every component, and every phase of the project. Before writing any code, read all rules in full. When in doubt, follow the rule — do not improvise.

---

## 1. General Behaviour

- **Never skip ahead.** Complete the current phase fully before starting the next.
- **Never assume.** If a requirement is unclear, state the ambiguity and propose two options before proceeding.
- **Never delete existing working code** unless explicitly instructed to refactor or replace it.
- **Never leave placeholder comments** like `// TODO: implement this` in committed code. Either implement it or raise it as a question.
- **Never hard-code values** that belong in constants, environment variables, or configuration files.
- **Always explain what you are about to do** before writing code — one short sentence is enough.
- **Always confirm** when a phase is complete, listing what was built and what tests were written.
- **Always use the latest version of the libraries**
- **Always use the relevant skills in the skills folder** to accomplish the task at hand.
- **Always check for existing code** in the codebase before writing new code.
- **Always refer to the PixelTrack_Development_Prompt.md** for the overall project requirements.

---

## 2. File & Folder Structure

- Follow the feature-based structure defined in the project prompt exactly:
  ```
  src/features/{feature}/
  src/components/
  src/hooks/
  src/lib/
  src/pages/
  src/routes/
  src/types/
  ```
- One component per file. File name must match the component name exactly (e.g. `TaskCard.tsx` exports `TaskCard`).
- Group related files inside their feature folder: component, hook, types, and tests together.
- Never put business logic inside a page component. Pages are layout and composition only.
- Never import from a sibling feature directly. Shared code must live in `src/components/`, `src/hooks/`, or `src/lib/`.

---

## 3. TypeScript Rules

- **Strict mode is on.** Never disable it. Never suppress TypeScript errors with `@ts-ignore` or `@ts-expect-error` unless absolutely unavoidable — and if used, always add a comment explaining why.
- **Never use `any`.** Use `unknown` if the type is truly unknown, then narrow it.
- Define all data shapes as interfaces in `src/types/`. Name them clearly: `Task`, `Client`, `UserProfile`, `Annotation`, `Notification`.
- All function parameters and return types must be explicitly typed.
- Use `type` for unions and intersections. Use `interface` for object shapes.
- Enums are allowed for fixed value sets (e.g. task status, user role).

```typescript
// ✅ Correct
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignees: string[];
  clientId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  IN_REVIEW = "in_review",
  COMPLETE = "complete",
  BLOCKED = "blocked",
}

// ❌ Wrong
const task: any = { ... }
```

---

## 4. Component Rules

- Every component must have a single, clear responsibility.
- Props must always be typed with an explicit interface. Never use inline prop types on complex components.
- Default props must be defined using default parameter values, not `defaultProps`.
- Never use index as a key in lists. Always use a stable unique ID.
- Never perform data fetching inside a UI component. Use a custom hook or TanStack Query.
- Avoid deeply nested JSX. Extract sub-sections into named sub-components.
- All interactive elements must have accessible labels (`aria-label`, `aria-describedby`, or visible text).

```tsx
// ✅ Correct
interface TaskCardProps {
  task: Task;
  onSelect: (id: string) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  return (
    <button aria-label={`Open task ${task.title}`} onClick={() => onSelect(task.id)}>
      {task.title}
    </button>
  );
}

// ❌ Wrong
export function TaskCard({ task, onSelect }: any) { ... }
```

---

## 5. State Management Rules

- Use **TanStack Query** for all server state (Firestore reads). Do not use `useState` + `useEffect` for data fetching.
- Use **React `useState`** or **`useReducer`** for local UI state only (modals open/closed, form steps, toggles).
- Never store server data in global state (e.g. Context or Zustand) when TanStack Query already caches it.
- Use **React Context** only for truly global app-wide state: current user, theme, role.
- Always set a `staleTime` on TanStack Query hooks. Never leave it at 0 for data that does not change every second.
- Always handle `isLoading`, `isError`, and `data` states in every component that uses a query.

```tsx
// ✅ Correct
const { data: tasks, isLoading, isError } = useQuery({
  queryKey: ["tasks", clientId],
  queryFn: () => fetchTasksByClient(clientId),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

if (isLoading) return <TaskListSkeleton />;
if (isError) return <ErrorMessage message="Failed to load tasks." />;
```

---

## 6. Firebase Rules

- **Never call Firebase directly from a page or UI component.** All Firebase calls must live inside `src/lib/firebase/` service files or custom hooks.
- Firebase config keys must only come from environment variables. Never commit real keys.
- All Firestore writes must use the correct collection path and document shape defined in the project schema.
- Use `serverTimestamp()` for all `createdAt` and `updatedAt` fields — never use `new Date()` on the client.
- When writing multiple Firestore documents together, use a **batch write** or **transaction**.
- Always check for the existence of a document before updating it.
- Never perform a Firestore `get()` inside a loop. Batch reads using `getDocs` with `where` queries.
- Cloud Functions must validate all input before touching the database. Return structured error responses.

```typescript
// ✅ Correct — service file pattern
// src/lib/firebase/tasks.ts
export async function createTask(data: CreateTaskInput): Promise<string> {
  const ref = doc(collection(db, "tasks"));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ❌ Wrong — Firebase in a component
function TaskForm() {
  const handleSubmit = async () => {
    await setDoc(doc(db, "tasks", id), { title }); // never do this
  };
}
```

---

## 7. Security Rules

- **Firestore Security Rules are mandatory.** Every collection must have explicit rules before it is used in the UI. Default open rules (`allow read, write: if true`) are never acceptable.
- Role checks must happen in Firestore Security Rules AND in the UI. Never rely on one layer alone.
- Never trust client-supplied data in Cloud Functions. Always validate with a schema (e.g. Zod on the server side).
- Never expose admin capabilities in client-side code. Use Cloud Functions with Admin SDK for privileged operations.
- File upload paths in Firebase Storage must include the user's UID or clientId to prevent path guessing.
- Always set `Content-Type` and validate file type on upload. Reject files that are not in the allowed list.

```
// ✅ Correct Firestore rule example
match /tasks/{taskId} {
  allow read: if request.auth != null &&
    (isAdmin() || isAssignedEmployee(resource.data.assignees) || isTaskClient(resource.data.clientId));
  allow write: if request.auth != null && isAdmin();
}
```

---

## 8. Form & Validation Rules

- All forms must use **React Hook Form** with a **Zod schema**.
- Define the Zod schema in the same file as the form or in a co-located `schema.ts` file.
- Always show inline validation errors beneath each field — never use alert dialogs for validation feedback.
- Disable the submit button while the form is submitting.
- Show a loading spinner or text change on the submit button during submission.
- Reset the form after a successful submission.
- Never submit a form if there are validation errors.

```tsx
// ✅ Correct pattern
const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  dueDate: z.string().min(1, "Due date is required"),
});

type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
  resolver: zodResolver(schema),
});
```

---

## 9. Styling Rules

- Use **Tailwind utility classes** only. Never write custom CSS files unless absolutely necessary.
- Never use inline `style={{}}` attributes for anything that can be expressed in Tailwind.
- Use the brand colour palette consistently. Do not introduce new colours outside the defined palette.
- Responsive classes must always follow mobile-first order: base → `sm:` → `md:` → `lg:`.
- Never use magic pixel values. Use Tailwind spacing scale (`p-4`, `mt-6`, `gap-3`, etc.).
- All interactive components must have visible focus styles for keyboard accessibility.
- Use `cn()` utility (from `shadcn/ui`) to merge conditional class names — never concatenate strings.

```tsx
// ✅ Correct
<button className={cn(
  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
  isActive ? "bg-[#0047AB] text-white" : "bg-white text-[#6D8196] border border-[#6D8196]"
)}>
  {label}
</button>

// ❌ Wrong
<button style={{ backgroundColor: "#0047AB", padding: "8px 16px" }}>
  {label}
</button>
```

---

## 10. Testing Rules

- Every feature must have tests before the phase is marked complete.
- Test file must be co-located with the feature: `TaskCard.test.tsx` next to `TaskCard.tsx`.
- Test file naming: `{ComponentOrFunction}.test.tsx` for components, `{hookName}.test.ts` for hooks.
- Always use the **Firebase Local Emulator** in tests. Never connect to production Firebase in any test.
- Mock external dependencies (storage, functions) using Vitest's `vi.mock()`.
- Each test must have a clear description: `it("shows an error message when task fetch fails")`.
- Tests must cover: happy path, error state, loading state, and empty state for every data-driven component.
- Do not test implementation details. Test what the user sees and what the component does.

```tsx
// ✅ Correct
it("disables the submit button while the form is submitting", async () => {
  render(<TaskForm />);
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));
  expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
});

// ❌ Wrong
it("calls setDoc with the correct arguments", () => { ... }); // testing internals
```

---

## 11. Error & Loading State Rules

- Every component that fetches data must render three states: **loading**, **error**, and **success**.
- Use **Shadcn Skeleton** components for loading states — never show a blank screen.
- Use a consistent `ErrorMessage` component for error states. It must show a human-readable message and a retry button where applicable.
- Never silently swallow errors. Always log to console in development.
- Use `try/catch` around every `async/await` call. Never use `.catch()` alone without re-throwing or handling.

---

## 12. Notification Rules

- All notification creation must happen inside **Cloud Functions**, never on the client.
- Never duplicate notification creation logic. One Cloud Function trigger per event type.
- Notifications must be scoped to the correct `userId`. Never create a notification without a target user.
- Real-time updates must use `onSnapshot` — never poll Firestore for notifications.
- Unread notification count must update instantly when a new notification arrives.

---

## 13. Cloud Functions Rules

- All Cloud Functions must be written in **TypeScript** using the Firebase Functions v2 SDK.
- Every function must have JSDoc describing its purpose, inputs, and outputs.
- Validate all request inputs at the top of the function before any logic runs.
- Return consistent response shapes: `{ success: true, data: ... }` or `{ success: false, error: "..." }`.
- Never perform long-running operations synchronously in an HTTP function. Use background functions where appropriate.
- Set appropriate timeout and memory limits in the function config.
- Enable CORS for all callable and HTTP functions accessed by the frontend.

```typescript
// ✅ Correct Cloud Function structure
export const createUser = onCall(async (request) => {
  // 1. Auth check
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  // 2. Role check
  const callerRole = await getRole(request.auth.uid);
  if (callerRole !== "admin") throw new HttpsError("permission-denied", "Admins only.");

  // 3. Input validation
  const parsed = createUserSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", parsed.error.message);

  // 4. Business logic
  const user = await admin.auth().createUser({ email: parsed.data.email });
  await db.collection("users").doc(user.uid).set({ role: parsed.data.role });

  // 5. Consistent response
  return { success: true, data: { uid: user.uid } };
});
```

---

## 14. Git & Commit Rules

- Commit at the end of every completed feature or sub-task — not at the end of the day.
- Follow **Conventional Commits** format:
  - `feat(scope): description` — new feature
  - `fix(scope): description` — bug fix
  - `refactor(scope): description` — code change with no behaviour change
  - `test(scope): description` — adding or updating tests
  - `chore(scope): description` — tooling, config, dependencies
- Never commit directly to `main`. Use feature branches named `feature/{phase}-{description}`.
- Never commit `.env.local`, Firebase service account keys, or any secrets.
- Run `npm run lint` and `npm run test` before every commit. Fix all errors before committing.

---

## 15. What the Agent Must Never Do

| ❌ Never | Reason |
|---|---|
| Use `any` in TypeScript | Defeats type safety |
| Call Firebase directly in components | Breaks separation of concerns |
| Write open Firestore security rules | Critical security risk |
| Skip loading/error states | Breaks user experience |
| Leave TODO comments in committed code | Indicates incomplete work |
| Use inline styles instead of Tailwind | Inconsistent design |
| Use `new Date()` for Firestore timestamps | Causes clock skew bugs |
| Run tests against production Firebase | Risk of data corruption |
| Store secrets in code | Security violation |
| Skip writing tests for a phase | Violates quality standards |
| Use `index` as a React list key | Causes rendering bugs |
| Fetch data inside UI components | Breaks architecture |
| Write Cloud Functions in JavaScript | TypeScript is required |
| Hard-code user IDs, client IDs, or role strings | Use constants and enums |

---

*End of Pixel Track Coding Agent Rules — v1.0*
