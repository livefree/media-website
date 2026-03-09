import { BrowseCatalogPage } from "../../components/BrowseCatalogPage";

export default function SeriesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <BrowseCatalogPage scope="series" searchParams={searchParams} />;
}
