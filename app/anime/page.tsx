import { BrowseCatalogPage } from "../../components/BrowseCatalogPage";

export const dynamic = "force-dynamic";

export default function AnimePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <BrowseCatalogPage scope="anime" searchParams={searchParams} />;
}
