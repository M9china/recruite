import { navigation } from "@/content/site";
import { DraftBanner } from "@/components/layout/DraftBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <>
      <DraftBanner />
      <SiteHeader items={navigation} />
      <main id="main" className="py-24 md:py-32">
        <Container>
          <p className="text-sm font-semibold text-forest-600">Error 404</p>
          <h1 className="mt-3 text-6xl leading-none">Page not found</h1>
          <p className="mt-4 max-w-lg text-lg text-stone-500">
            This page does not exist or has moved. Try the careers list or go back to the homepage.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/careers">Explore careers</ButtonLink>
            <ButtonLink href="/" variant="outline">
              Back to home
            </ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
