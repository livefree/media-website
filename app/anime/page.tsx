import { BrowseCatalogPage } from "../../components/BrowseCatalogPage";

export default function AnimePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <BrowseCatalogPage scope="anime" searchParams={searchParams} />;
}
