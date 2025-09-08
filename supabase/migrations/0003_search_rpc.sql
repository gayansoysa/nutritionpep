-- Full-text search RPC using the existing GIN index

create or replace function public.search_foods(q text, max_results int default 20)
returns table (
	id uuid,
	name text,
	brand text,
	barcode text,
	serving_sizes jsonb,
	nutrients_per_100g jsonb,
	score real
)
language sql
stable
as $$
  with ranked as (
    select f.id,
           f.name,
           f.brand,
           f.barcode,
           f.serving_sizes,
           f.nutrients_per_100g,
           ts_rank(
             to_tsvector('simple', coalesce(f.name,'') || ' ' || coalesce(f.brand,'')),
             websearch_to_tsquery('simple', q)
           ) as score
    from public.foods f
    where to_tsvector('simple', coalesce(f.name,'') || ' ' || coalesce(f.brand,'')) @@ websearch_to_tsquery('simple', q)
    order by score desc
    limit max_results
  )
  select * from ranked;
$$;

