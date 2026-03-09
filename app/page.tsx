import { BrowseCatalogPage } from "../components/BrowseCatalogPage";

export default function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <BrowseCatalogPage scope="all" searchParams={searchParams} />;
}
