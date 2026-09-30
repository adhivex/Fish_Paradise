import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <main className="bg-cream mx-auto min-h-dvh max-w-[480px] pt-10 pb-10">
      <EmptyState
        icon="fish"
        title="This one got away"
        body="We couldn't find that page."
        action={
          <ButtonLink href="/" block={false} className="w-[220px]">
            Back to home
          </ButtonLink>
        }
      />
    </main>
  );
}
