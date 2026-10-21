import {
	NodeApiError,
	NodeOperationError,
	sleep,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type INodeProperties,
	type INodePropertyOptions,
	type JsonObject,
	type PostReceiveAction,
} from 'n8n-workflow';
import { PRINTFUL_BASE_URL, storeHeader, USER_AGENT } from './transport';

/**
 * Every Printful answer is wrapped as { code, result, paging? }. On success this unwraps
 * `result` (splitting arrays into items); on failure it raises with Printful's own reason,
 * because n8n's default handling would only show "Bad request".
 * The node sets `ignoreHttpStatusErrors` so this function sees every response.
 */
export async function handlePrintfulResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode ?? 200;
	const body = (
		typeof response.body === 'object' && response.body !== null ? response.body : {}
	) as IDataObject;

	if (status < 400) {
		const result = body.result !== undefined ? body.result : body;
		if (Array.isArray(result)) {
			return (result as IDataObject[]).map((json) => ({ json }));
		}
		if (result !== null && typeof result === 'object') {
			return [{ json: result as IDataObject }];
		}
		return [{ json: { result } }];
	}

	const error = (body.error as IDataObject | undefined) ?? {};
	const reason = error.reason as string | undefined;
	const message =
		(error.message as string | undefined) ??
		(typeof body.result === 'string' ? body.result : undefined) ??
		'';

	const summary: Record<number, string> = {
		401: 'Printful rejected the token. Check the Printful API credential (tokens expire)',
		403: 'The token is missing the scope this operation needs, or the store ID is wrong',
		404: 'Printful could not find that resource. Check the IDs and the store',
		429: 'Printful rate limit reached (120 requests per minute). Try again shortly',
	};

	let description = reason ? `Reason: ${reason}` : summary[status];
	if (/store[_ ]?id/i.test(message)) {
		description =
			'This token is account-level, so Printful needs to know which store to use. ' +
			'Put the store ID into the Printful API credential (Store > Get Many lists your stores and their IDs).';
	}

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		httpCode: String(status),
		message: message || summary[status] || `Printful returned status ${status}`,
		description,
	});
}

/** preSend that adds the X-PF-Store-Id header when the credential names a store. */
export async function addStoreHeader(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.headers = {
		...(requestOptions.headers ?? {}),
		...(await storeHeader.call(this)),
	};
	return requestOptions;
}

/** Applies the store header and the envelope/error handling to every operation. */
export function withPrintfulDefaults(properties: INodeProperties[]): INodeProperties[] {
	for (const property of properties) {
		if (property.name !== 'operation' || !Array.isArray(property.options)) continue;
		for (const option of property.options as INodePropertyOptions[]) {
			if (!option.routing) continue;
			option.routing.send = option.routing.send ?? {};
			option.routing.send.preSend = [addStoreHeader, ...(option.routing.send.preSend ?? [])];
			option.routing.output = option.routing.output ?? {};
			option.routing.output.postReceive = [
				handlePrintfulResponse,
				...(option.routing.output.postReceive ?? []),
			];
		}
	}
	return properties;
}

/**
 * Printful lists are offset based: { result: [...], paging: { total, offset, limit } }.
 * This asks for the next slice until `total` is reached; n8n stops early once
 * `maxResults` (the Limit parameter) is satisfied.
 */
export const offsetPagination = {
	pagination: {
		type: 'generic' as const,
		properties: {
			continue:
				'={{ !!$response.body.paging && ($response.body.paging.offset + $response.body.paging.limit) < $response.body.paging.total }}',
			request: {
				qs: {
					offset: '={{ $response.body.paging.offset + $response.body.paging.limit }}',
				},
			},
		},
	},
};

/** Replaces an empty delete response with the n8n convention `{ deleted: true }`. */
export const deletedOutput: PostReceiveAction = {
	type: 'set',
	properties: { value: '={{ { "deleted": true } }}' },
};

/** Replaces an empty 200 response with `{ success: true }`. */
export const successOutput: PostReceiveAction = {
	type: 'set',
	properties: { value: '={{ { "success": true } }}' },
};

/** Splits a property of the response into items (for `{ items: [...] }` style results). */
export function rootProperty(property: string): PostReceiveAction {
	return { type: 'rootProperty', properties: { property } };
}

/** "Return All" + "Limit" pair for an offset-paginated Get Many operation. */
export function paginationProperties(
	show: { resource: string[]; operation: string[] },
	apiMax = 100,
): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
			routing: {
				send: {
					paginate: '={{ $value }}',
					type: 'query',
					property: 'limit',
					value: String(apiMax),
				},
				operations: offsetPagination,
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				send: {
					paginate: true,
					type: 'query',
					property: 'limit',
					value: `={{ Math.min($value, ${apiMax}) }}`,
				},
				output: { maxResults: '={{ $value }}' },
				operations: offsetPagination,
			},
		},
	];
}

/** "Return All" + "Limit" pair for endpoints that return one array with no paging. */
export function clientSideLimitProperties(show: {
	resource: string[];
	operation: string[];
}): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				output: { maxResults: '={{ $value }}' },
			},
		},
	];
}

/** Parses a JSON parameter that may arrive as a string or as an already-parsed value. */
export function parseJson(
	context: IExecuteSingleFunctions,
	value: unknown,
	displayName: string,
): IDataObject | IDataObject[] | undefined {
	if (typeof value !== 'string') return value as IDataObject | IDataObject[] | undefined;
	const trimmed = value.trim();
	if (trimmed === '') return undefined;
	try {
		return JSON.parse(trimmed) as IDataObject | IDataObject[];
	} catch {
		throw new NodeOperationError(context.getNode(), `'${displayName}' must be valid JSON`, {
			description: 'Check for missing quotes, unquoted keys or trailing commas',
		});
	}
}

function toNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const n = Number(value);
	return Number.isNaN(n) ? undefined : n;
}

/** Comma-separated string (or array) to an array of trimmed strings. */
function splitList(value: unknown): string[] {
	if (value === undefined || value === null) return [];
	if (Array.isArray(value)) return value.map(String).filter(Boolean);
	return String(value)
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

/** Copies the non-empty keys of a collection parameter into a plain object. */
function compact(source: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(source)) {
		if (value !== undefined && value !== null && value !== '') out[key] = value;
	}
	return out;
}

type ItemInput = {
	identifyBy: string;
	id?: string;
	quantity?: number;
	external_id?: string;
	retail_price?: string;
	value?: string;
	files?: string;
};

const NUMERIC_IDENTIFIERS = new Set([
	'variant_id',
	'sync_variant_id',
	'warehouse_product_variant_id',
	'product_template_id',
]);

function buildItems(this: IExecuteSingleFunctions): IDataObject[] {
	const mode = this.getNodeParameter('itemsMode', 'fields') as string;
	if (mode === 'json') {
		const parsed = parseJson(this, this.getNodeParameter('itemsJson', '[]'), 'Items (JSON)');
		if (!Array.isArray(parsed) || parsed.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				"'Items (JSON)' must be a non-empty array of items",
			);
		}
		return parsed as IDataObject[];
	}

	const collection = this.getNodeParameter('items', {}) as { item?: ItemInput[] };
	const entries = collection.item ?? [];
	if (entries.length === 0) {
		throw new NodeOperationError(this.getNode(), "Add at least one entry under 'Items'");
	}

	return entries.map((entry, index) => {
		const id = String(entry.id ?? '').trim();
		if (!id) {
			throw new NodeOperationError(this.getNode(), `'ID' is required for item ${index + 1}`);
		}
		const item: IDataObject = {
			[entry.identifyBy]: NUMERIC_IDENTIFIERS.has(entry.identifyBy) ? (toNumber(id) ?? id) : id,
			quantity: entry.quantity ?? 1,
		};
		if (entry.external_id) item.external_id = entry.external_id;
		if (entry.retail_price) item.retail_price = entry.retail_price;
		if (entry.value) item.value = entry.value;
		const files = parseJson(this, entry.files, `Print Files (item ${index + 1})`);
		if (files !== undefined) item.files = files;
		return item;
	});
}

function buildRecipient(this: IExecuteSingleFunctions, required: string[]): IDataObject {
	const recipient = compact(this.getNodeParameter('recipient', {}) as IDataObject);
	const missing = required.filter((key) => !recipient[key]);
	if (missing.length > 0) {
		throw new NodeOperationError(
			this.getNode(),
			`'Recipient' is missing ${missing.join(', ').replace(/_/g, ' ')}`,
			{ description: 'Printful needs these fields before it will accept the request' },
		);
	}
	return recipient;
}

/** preSend for Order > Create and Order > Estimate Costs. */
export async function buildOrderBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const options = this.getNodeParameter('additionalFields', {}) as IDataObject;
	const body: IDataObject = {
		recipient: buildRecipient.call(this, ['name', 'address1', 'city', 'country_code', 'zip']),
		items: buildItems.call(this),
	};
	if (options.externalId) body.external_id = options.externalId;
	if (options.shipping) body.shipping = options.shipping;
	if (options.giftSubject || options.giftMessage) {
		body.gift = compact({ subject: options.giftSubject, message: options.giftMessage });
	}
	const retailCosts = parseJson(this, options.retailCosts, 'Retail Costs');
	if (retailCosts !== undefined) body.retail_costs = retailCosts;
	const packingSlip = parseJson(this, options.packingSlip, 'Packing Slip');
	if (packingSlip !== undefined) body.packing_slip = packingSlip;

	const qs: IDataObject = { ...(requestOptions.qs ?? {}) };
	if (this.getNodeParameter('confirm', false) as boolean) qs.confirm = 'true';
	if (options.updateExisting) qs.update_existing = 'true';

	requestOptions.body = body;
	requestOptions.qs = qs;
	return requestOptions;
}

/** preSend for Order > Update: only the fields given are sent. */
export async function buildOrderUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as IDataObject;
	const body: IDataObject = {};
	if (fields.externalId) body.external_id = fields.externalId;
	if (fields.shipping) body.shipping = fields.shipping;
	const recipient = parseJson(this, fields.recipient, 'Recipient');
	if (recipient !== undefined) body.recipient = recipient;
	const items = parseJson(this, fields.items, 'Items');
	if (items !== undefined) body.items = items;
	if (fields.giftSubject || fields.giftMessage) {
		body.gift = compact({ subject: fields.giftSubject, message: fields.giftMessage });
	}
	if (Object.keys(body).length === 0 && !(this.getNodeParameter('confirm', false) as boolean)) {
		throw new NodeOperationError(
			this.getNode(),
			"Add at least one field under 'Update Fields' or turn on 'Confirm'",
		);
	}
	const qs: IDataObject = { ...(requestOptions.qs ?? {}) };
	if (this.getNodeParameter('confirm', false) as boolean) qs.confirm = 'true';
	requestOptions.body = body;
	requestOptions.qs = qs;
	return requestOptions;
}

/** preSend for Shipping > Calculate Rates. */
export async function buildShippingRatesBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const options = this.getNodeParameter('additionalFields', {}) as IDataObject;
	const body: IDataObject = {
		recipient: buildRecipient.call(this, ['country_code']),
		items: buildItems.call(this),
	};
	if (options.currency) body.currency = options.currency;
	if (options.locale) body.locale = options.locale;
	requestOptions.body = body;
	return requestOptions;
}

type VariantInput = {
	variant_id?: number;
	external_id?: string;
	fileType?: string;
	fileUrl?: string;
	retail_price?: string;
	sku?: string;
};

function buildSyncVariants(this: IExecuteSingleFunctions): IDataObject[] {
	const mode = this.getNodeParameter('variantsMode', 'fields') as string;
	if (mode === 'json') {
		const parsed = parseJson(this, this.getNodeParameter('variantsJson', '[]'), 'Variants (JSON)');
		if (!Array.isArray(parsed) || parsed.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				"'Variants (JSON)' must be a non-empty array of sync variants",
			);
		}
		return parsed as IDataObject[];
	}
	const collection = this.getNodeParameter('variants', {}) as { variant?: VariantInput[] };
	const entries = collection.variant ?? [];
	if (entries.length === 0) {
		throw new NodeOperationError(this.getNode(), "Add at least one entry under 'Variants'");
	}
	return entries.map((entry, index) => {
		if (!entry.variant_id) {
			throw new NodeOperationError(
				this.getNode(),
				`'Catalog Variant ID' is required for variant ${index + 1}`,
			);
		}
		if (!entry.fileUrl) {
			throw new NodeOperationError(
				this.getNode(),
				`'Print File URL' is required for variant ${index + 1}`,
			);
		}
		const variant: IDataObject = {
			variant_id: entry.variant_id,
			files: [{ type: entry.fileType || 'default', url: entry.fileUrl }],
		};
		if (entry.retail_price) variant.retail_price = entry.retail_price;
		if (entry.sku) variant.sku = entry.sku;
		if (entry.external_id) variant.external_id = entry.external_id;
		return variant;
	});
}

/** preSend for Product > Create (a Sync Product with its Sync Variants). */
export async function buildProductCreateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const additional = this.getNodeParameter('additionalFields', {}) as IDataObject;
	const syncProduct: IDataObject = { name: this.getNodeParameter('name', '') as string };
	if (additional.thumbnail) syncProduct.thumbnail = additional.thumbnail;
	if (additional.externalId) syncProduct.external_id = additional.externalId;
	requestOptions.body = {
		sync_product: syncProduct,
		sync_variants: buildSyncVariants.call(this),
	};
	return requestOptions;
}

/** preSend for Product > Update. */
export async function buildProductUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as IDataObject;
	const syncProduct = compact({
		name: fields.name,
		thumbnail: fields.thumbnail,
		external_id: fields.externalId,
	});
	if (fields.isIgnored !== undefined) syncProduct.is_ignored = fields.isIgnored;
	const body: IDataObject = {};
	if (Object.keys(syncProduct).length > 0) body.sync_product = syncProduct;
	const variants = parseJson(this, fields.syncVariants, 'Variants');
	if (variants !== undefined) body.sync_variants = variants;
	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(this.getNode(), "Add at least one field under 'Update Fields'");
	}
	requestOptions.body = body;
	return requestOptions;
}

/** preSend for Product Variant > Create. */
export async function buildVariantCreateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const additional = this.getNodeParameter('additionalFields', {}) as IDataObject;
	const files = parseJson(this, additional.files, 'Print Files');
	const body: IDataObject = {
		variant_id: toNumber(this.getNodeParameter('catalogVariantId', 0)),
		files: files ?? [
			{
				type: (additional.fileType as string) || 'default',
				url: this.getNodeParameter('fileUrl', '') as string,
			},
		],
	};
	if (additional.retailPrice) body.retail_price = additional.retailPrice;
	if (additional.sku) body.sku = additional.sku;
	if (additional.externalId) body.external_id = additional.externalId;
	const options = parseJson(this, additional.options, 'Options');
	if (options !== undefined) body.options = options;
	requestOptions.body = body;
	return requestOptions;
}

/** preSend for Product Variant > Update and Platform Variant > Update. */
export async function buildVariantUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as IDataObject;
	const body = compact({
		variant_id: toNumber(fields.catalogVariantId),
		retail_price: fields.retailPrice,
		sku: fields.sku,
		external_id: fields.externalId,
	});
	if (fields.isIgnored !== undefined) body.is_ignored = fields.isIgnored;
	const files = parseJson(this, fields.files, 'Print Files');
	if (files !== undefined) body.files = files;
	const options = parseJson(this, fields.options, 'Options');
	if (options !== undefined) body.options = options;
	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(this.getNode(), "Add at least one field under 'Update Fields'");
	}
	requestOptions.body = body;
	return requestOptions;
}

/** preSend for Webhook > Set. */
export async function buildWebhookBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const types = this.getNodeParameter('events', []) as string[];
	if (types.length === 0) {
		throw new NodeOperationError(this.getNode(), "Select at least one event under 'Events'");
	}
	const body: IDataObject = { url: this.getNodeParameter('url', '') as string, types };
	const productIds = splitList(this.getNodeParameter('stockProductIds', '')).map(Number);
	if (productIds.length > 0) {
		body.params = { stock_updated: { product_ids: productIds } };
	}
	requestOptions.body = body;
	return requestOptions;
}

/** preSend for Mockup > Create Task. */
export async function buildMockupTaskBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const additional = this.getNodeParameter('additionalFields', {}) as IDataObject;
	const body: IDataObject = {
		variant_ids: splitList(this.getNodeParameter('variantIds', '')).map(Number),
		format: this.getNodeParameter('format', 'jpg') as string,
	};
	if (body.variant_ids && (body.variant_ids as number[]).length === 0) {
		throw new NodeOperationError(this.getNode(), "'Variant IDs' must list at least one catalog variant");
	}
	const source = this.getNodeParameter('source', 'files') as string;
	if (source === 'template') {
		body.product_template_id = toNumber(this.getNodeParameter('productTemplateId', 0));
	} else {
		const files = parseJson(this, this.getNodeParameter('files', ''), 'Files');
		if (!Array.isArray(files) || files.length === 0) {
			throw new NodeOperationError(this.getNode(), "'Files' must be a non-empty array");
		}
		// Printful requires a position for every file. When the user leaves it out, look up the
		// print area of the first variant and fit the image to the whole area.
		if (files.some((file) => file.position === undefined)) {
			const catalogProductId = this.getNodeParameter('catalogProductId', '', {
				extractValue: true,
			}) as string | number;
			const info = await fetchPrintfileInfo.call(this, catalogProductId);
			const firstVariant = (body.variant_ids as number[])[0];
			for (const file of files) {
				if (file.position !== undefined) continue;
				const placement = String(file.placement ?? 'front');
				const printfile = findPrintfile(info, firstVariant, placement);
				if (!printfile) {
					throw new NodeOperationError(
						this.getNode(),
						`No print area found for placement '${placement}' on variant ${firstVariant}`,
						{
							description:
								'Check Mockup > Get Printfiles for the placements this product supports, or add a position object to the file',
						},
					);
				}
				file.position = {
					area_width: printfile.width,
					area_height: printfile.height,
					width: printfile.width,
					height: printfile.height,
					top: 0,
					left: 0,
				};
			}
		}
		body.files = files;
	}
	const optionGroups = splitList(additional.optionGroups);
	if (optionGroups.length > 0) body.option_groups = optionGroups;
	const options = splitList(additional.options);
	if (options.length > 0) body.options = options;
	const productOptions = parseJson(this, additional.productOptions, 'Product Options');
	if (productOptions !== undefined) body.product_options = productOptions;
	requestOptions.body = body;
	return requestOptions;
}

interface PrintfileInfo {
	printfiles?: Array<{ printfile_id: number; width: number; height: number }>;
	variant_printfiles?: Array<{ variant_id: number; placements: Record<string, number> }>;
}

/** GET /mockup-generator/printfiles/{product}: print areas per variant and placement. */
async function fetchPrintfileInfo(
	this: IExecuteSingleFunctions,
	catalogProductId: string | number,
): Promise<PrintfileInfo> {
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'printfulApi', {
		method: 'GET',
		url: `${PRINTFUL_BASE_URL}/mockup-generator/printfiles/${catalogProductId}`,
		headers: {
			Accept: 'application/json',
			'User-Agent': USER_AGENT,
			...(await storeHeader.call(this)),
		},
		json: true,
	})) as { result?: PrintfileInfo };
	return response.result ?? {};
}

function findPrintfile(info: PrintfileInfo, variantId: number, placement: string) {
	const variant =
		info.variant_printfiles?.find((entry) => entry.variant_id === variantId) ??
		info.variant_printfiles?.[0];
	const printfileId = variant?.placements?.[placement];
	if (printfileId === undefined) return undefined;
	return info.printfiles?.find((entry) => entry.printfile_id === printfileId);
}

/**
 * postReceive for Mockup > Create Task: when "Wait for Completion" is on, polls the task
 * until Printful reports `completed` or `failed` (every 5 s, up to the configured maximum).
 */
export async function waitForMockupTask(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	if (!(this.getNodeParameter('waitForCompletion', true) as boolean)) return items;
	const maxWait = Number(this.getNodeParameter('maxWaitSeconds', 120)) || 120;
	const headers = {
		Accept: 'application/json',
		'User-Agent': USER_AGENT,
		...(await storeHeader.call(this)),
	};

	const out: INodeExecutionData[] = [];
	for (const item of items) {
		let task = item.json;
		const taskKey = task.task_key as string | undefined;
		const started = Date.now();
		while (taskKey && task.status === 'pending' && Date.now() - started < maxWait * 1000) {
			await sleep(5000);
			const response = (await this.helpers.httpRequestWithAuthentication.call(
				this,
				'printfulApi',
				{
					method: 'GET',
					url: `${PRINTFUL_BASE_URL}/mockup-generator/task`,
					qs: { task_key: taskKey },
					headers,
					json: true,
				},
			)) as { result?: IDataObject };
			task = response.result ?? task;
		}
		if (task.status === 'failed') {
			throw new NodeOperationError(
				this.getNode(),
				`Mockup task failed: ${String(task.error ?? 'no reason given')}`,
			);
		}
		if (task.status === 'pending') {
			throw new NodeOperationError(
				this.getNode(),
				`Mockup task ${taskKey} is still pending after ${maxWait} seconds`,
				{ description: 'Use Mockup > Get Task with the task key to fetch the result later' },
			);
		}
		out.push({ json: task, pairedItem: item.pairedItem });
	}
	return out;
}

function pick(source: IDataObject, keys: string[]): IDataObject {
	const out: IDataObject = {};
	for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
	return out;
}

/** postReceive that trims an order to its most used fields when "Simplify" is on. */
export async function simplifyOrder(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	if (!(this.getNodeParameter('simplify', true) as boolean)) return items;
	return items.map((item) => {
		const o = item.json;
		const recipient = (o.recipient as IDataObject) ?? {};
		const costs = (o.costs as IDataObject) ?? {};
		const shipments = (o.shipments as IDataObject[]) ?? [];
		return {
			json: {
				...pick(o, ['id', 'external_id', 'status', 'shipping', 'shipping_service_name']),
				recipient_name: recipient.name ?? null,
				country_code: recipient.country_code ?? null,
				items: ((o.items as IDataObject[]) ?? []).length,
				total: costs.total ?? null,
				currency: costs.currency ?? null,
				tracking_url: shipments[0]?.tracking_url ?? null,
				created: o.created,
				updated: o.updated,
			},
			pairedItem: item.pairedItem,
		};
	});
}
