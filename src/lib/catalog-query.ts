import { queryOptions } from "@tanstack/react-query";
import { getCatalog } from "@/lib/catalog.functions";

export const catalogOptions = queryOptions({ queryKey: ["sushi-catalog"], queryFn: () => getCatalog(), staleTime: 60_000 });