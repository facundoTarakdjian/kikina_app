import { SignOutButton } from "./SignOutButton";

export default function AjustesPage() {
  return (
    <main className="min-h-full bg-paper flex flex-col px-6 pt-6">
      <h1 className="text-h1 text-ink mb-8">Ajustes</h1>

      <div className="flex flex-col gap-2">
        <SignOutButton />
      </div>
    </main>
  );
}
