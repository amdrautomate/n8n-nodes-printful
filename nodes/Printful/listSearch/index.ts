import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { printfulApiRequest, printfulApiRequestRaw } from '../shared/transport';

const PAGE = 100;

function matches(filter: string | undefined, ...fields: unknown[]): boolean {
	if (!filter) return true;
	const needle = filter.toLowerCase();
	return fields.some((f) =>
		String(f ?? '')
			.toLowerCase()
			.includes(needle),
	);
}

function nextToken(paging?: { total: number; offset: number; limit: number }): string | undefined {
	if (!paging) return undefined;
	const next = paging.offset + paging.limit;
	return next < paging.total ? String(next) : undefined;
}

export async function getStores(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const stores = (await printfulApiRequest.call(this, 'GET', '/stores')) as IDataObject[];
	const results: INodeListSearchItems[] = stores
		.filter((s) => matches(filter, s.name, s.type, s.id))
		.map((s) => ({ name: `${s.name} (${s.type})`, value: String(s.id) }));
	return { results };
}

export async function getCatalogProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const products = (await printfulApiRequest.call(this, 'GET', '/products')) as IDataObject[];
	const results: INodeListSearchItems[] = products
		.filter((p) => !p.is_discontinued)
		.filter((p) => matches(filter, p.title, p.brand, p.model, p.type_name, p.id))
		.slice(0, 200)
		.map((p) => ({
			name: `${p.title} (${[p.brand, p.model].filter(Boolean).join(' ')})`.replace(' ()', ''),
			value: String(p.id),
		}));
	return { results };
}

export async function getStoreProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const offset = paginationToken ? Number(paginationToken) : 0;
	const response = await printfulApiRequestRaw.call(this, 'GET', '/store/products', {
		limit: PAGE,
		offset,
	});
	const results: INodeListSearchItems[] = (response.result ?? [])
		.filter((p) => matches(filter, p.name, p.external_id, p.id))
		.map((p) => ({ name: String(p.name), value: String(p.id) }));
	return { results, paginationToken: nextToken(response.paging) };
}

export async function getPlatformProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const offset = paginationToken ? Number(paginationToken) : 0;
	const qs: IDataObject = { limit: PAGE, offset };
	if (filter) qs.search = filter;
	const response = await printfulApiRequestRaw.call(this, 'GET', '/sync/products', qs);
	const results: INodeListSearchItems[] = (response.result ?? []).map((p) => ({
		name: String(p.name),
		value: String(p.id),
	}));
	return { results, paginationToken: nextToken(response.paging) };
}

export async function getProductTemplates(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const offset = paginationToken ? Number(paginationToken) : 0;
	const response = (await printfulApiRequestRaw.call(this, 'GET', '/product-templates', {
		limit: PAGE,
		offset,
	})) as unknown as {
		result: { items?: IDataObject[] };
		paging?: { total: number; offset: number; limit: number };
	};
	const results: INodeListSearchItems[] = (response.result?.items ?? [])
		.filter((t) => matches(filter, t.title, t.external_product_id, t.id))
		.map((t) => ({ name: String(t.title), value: String(t.id) }));
	return { results, paginationToken: nextToken(response.paging) };
}
