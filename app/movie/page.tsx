import { BrowseCatalogPage } from "../../components/BrowseCatalogPage";

export default function MoviePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <BrowseCatalogPage scope="movie" searchParams={searchParams} />;
}
