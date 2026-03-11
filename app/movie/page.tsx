import { BrowseCatalogPage } from "../../components/BrowseCatalogPage";

export const dynamic = "force-dynamic";

export default function MoviePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <BrowseCatalogPage scope="movie" searchParams={searchParams} />;
}
