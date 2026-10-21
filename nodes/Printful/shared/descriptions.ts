import type { INodeProperties } from 'n8n-workflow';

function numericId(
	displayName: string,
	placeholder: string,
	searchListMethod: string,
): INodeProperties {
	return {
		displayName,
		name: '',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: `Select ${displayName.toLowerCase()}...`,
				typeOptions: { searchListMethod, searchable: true },
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder,
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: `${displayName} IDs are numeric`,
						},
					},
				],
			},
		],
	};
}

/** Store picker (Store > Get). */
export const storeSelect: INodeProperties = {
	...numericId('Store', 'e.g. 12345678', 'getStores'),
	name: 'storeId',
	description: 'The Printful store',
};

/** Catalog product picker (blank product such as a t-shirt model). */
export const catalogProductSelect: INodeProperties = {
	...numericId('Catalog Product', 'e.g. 71', 'getCatalogProducts'),
	name: 'catalogProductId',
	description: 'The blank product from the Printful catalog, for example a specific t-shirt model',
};

/** Store product picker (a Sync Product in a Manual order / API store). */
export const productSelect: INodeProperties = {
	displayName: 'Product',
	name: 'productId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The product in your Printful store',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a product...',
			typeOptions: { searchListMethod: 'getStoreProducts', searchable: true },
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 123456789 or @my-external-id',
		},
	],
};

/** Platform product picker (a product imported from Shopify, Etsy, WooCommerce ...). */
export const platformProductSelect: INodeProperties = {
	displayName: 'Platform Product',
	name: 'platformProductId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'A product imported from the connected ecommerce platform',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a product...',
			typeOptions: { searchListMethod: 'getPlatformProducts', searchable: true },
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 123456789 or @shopify-product-id',
		},
	],
};

export const productTemplateSelect: INodeProperties = {
	displayName: 'Product Template',
	name: 'templateId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'A product template saved in the Printful dashboard',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a template...',
			typeOptions: { searchListMethod: 'getProductTemplates', searchable: true },
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 123456 or @external-product-id',
		},
	],
};

export const simplifyToggle: INodeProperties = {
	displayName: 'Simplify',
	name: 'simplify',
	type: 'boolean',
	default: true,
	description: 'Whether to return a simplified version of the response instead of the raw data',
};

export const WEBHOOK_EVENTS = [
	{ name: 'Order Canceled', value: 'order_canceled' },
	{ name: 'Order Created', value: 'order_created' },
	{ name: 'Order Failed', value: 'order_failed' },
	{ name: 'Order Put On Hold', value: 'order_put_hold' },
	{ name: 'Order Put On Hold (Approval Needed)', value: 'order_put_hold_approval' },
	{ name: 'Order Refunded', value: 'order_refunded' },
	{ name: 'Order Removed From Hold', value: 'order_remove_hold' },
	{ name: 'Order Updated', value: 'order_updated' },
	{ name: 'Package Returned', value: 'package_returned' },
	{ name: 'Package Shipped', value: 'package_shipped' },
	{ name: 'Product Deleted', value: 'product_deleted' },
	{ name: 'Product Synced', value: 'product_synced' },
	{ name: 'Product Updated', value: 'product_updated' },
	{ name: 'Stock Updated', value: 'stock_updated' },
];

export const ORDER_STATUSES = [
	{ name: 'Archived', value: 'archived' },
	{ name: 'Canceled', value: 'canceled' },
	{ name: 'Draft', value: 'draft' },
	{ name: 'Failed', value: 'failed' },
	{ name: 'Fulfilled', value: 'fulfilled' },
	{ name: 'In Process', value: 'inprocess' },
	{ name: 'In Review', value: 'inreview' },
	{ name: 'On Hold', value: 'onhold' },
	{ name: 'Partial', value: 'partial' },
	{ name: 'Pending', value: 'pending' },
];

export const PRODUCT_STATUSES = [
	{ name: 'All', value: 'all' },
	{ name: 'Discontinued', value: 'discontinued' },
	{ name: 'Ignored', value: 'ignored' },
	{ name: 'Imported', value: 'imported' },
	{ name: 'Out of Stock', value: 'out_of_stock' },
	{ name: 'Synced', value: 'synced' },
	{ name: 'Unsynced', value: 'unsynced' },
];

/** Recipient address for Order > Create / Estimate Costs. */
export const recipientFields: INodeProperties = {
	displayName: 'Recipient',
	name: 'recipient',
	type: 'collection',
	placeholder: 'Add Recipient Field',
	default: {},
	required: true,
	description:
		'Where the order ships. Name, address line 1, city, country code and ZIP are required; state code is required for the US, Canada and Australia.',
	options: [
		{
			displayName: 'Address Line 1',
			name: 'address1',
			type: 'string',
			default: '',
			placeholder: 'e.g. 123 Main Street',
		},
		{
			displayName: 'Address Line 2',
			name: 'address2',
			type: 'string',
			default: '',
			placeholder: 'e.g. Apt 4B',
		},
		{ displayName: 'City', name: 'city', type: 'string', default: '', placeholder: 'e.g. Austin' },
		{ displayName: 'Company', name: 'company', type: 'string', default: '' },
		{
			displayName: 'Country Code',
			name: 'country_code',
			type: 'string',
			default: '',
			placeholder: 'e.g. US',
			description:
				'Two-letter ISO country code. Country > Get Many lists the accepted codes and states.',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
			placeholder: 'e.g. name@email.com',
		},
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			default: '',
			placeholder: 'e.g. Ada Lovelace',
		},
		{
			displayName: 'Phone',
			name: 'phone',
			type: 'string',
			default: '',
			placeholder: 'e.g. +1 512 555 0100',
		},
		{
			displayName: 'State Code',
			name: 'state_code',
			type: 'string',
			default: '',
			placeholder: 'e.g. TX',
			description: 'Required for US, CA and AU addresses',
		},
		{
			displayName: 'Tax Number',
			name: 'tax_number',
			type: 'string',
			default: '',
			description: 'Required for Brazil (CPF/CNPJ)',
		},
		{
			displayName: 'ZIP / Postal Code',
			name: 'zip',
			type: 'string',
			default: '',
			placeholder: 'e.g. 78701',
		},
	],
};

/** Minimal recipient for Shipping > Calculate Rates (only the country is required). */
export const shippingRecipientFields: INodeProperties = {
	displayName: 'Recipient',
	name: 'recipient',
	type: 'collection',
	placeholder: 'Add Recipient Field',
	default: {},
	required: true,
	description:
		'Destination of the shipment. Only the country code is required; state code for US, CA and AU.',
	options: [
		{ displayName: 'Address Line 1', name: 'address1', type: 'string', default: '' },
		{ displayName: 'City', name: 'city', type: 'string', default: '' },
		{
			displayName: 'Country Code',
			name: 'country_code',
			type: 'string',
			default: '',
			placeholder: 'e.g. US',
			description: 'Two-letter ISO country code',
		},
		{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
		{
			displayName: 'State Code',
			name: 'state_code',
			type: 'string',
			default: '',
			placeholder: 'e.g. TX',
		},
		{ displayName: 'ZIP / Postal Code', name: 'zip', type: 'string', default: '' },
	],
};

const ORDER_ITEM_IDENTIFIERS = [
	{
		name: 'Catalog Variant ID',
		value: 'variant_id',
		description: 'A blank catalog variant, printed with the files you attach',
	},
	{
		name: 'External Variant ID',
		value: 'external_variant_id',
		description: 'The variant ID from your ecommerce platform',
	},
	{
		name: 'Product Template ID',
		value: 'product_template_id',
		description: 'A saved product template plus a catalog variant',
	},
	{
		name: 'Store Variant ID',
		value: 'sync_variant_id',
		description: 'A variant of a product in your Printful store',
	},
	{
		name: 'Warehouse Variant ID',
		value: 'warehouse_product_variant_id',
		description: 'A warehoused item',
	},
];

const SHIPPING_ITEM_IDENTIFIERS = [
	{ name: 'Catalog Variant ID', value: 'variant_id' },
	{ name: 'External Variant ID', value: 'external_variant_id' },
	{ name: 'Warehouse Variant ID', value: 'warehouse_product_variant_id' },
];

/** Line items with a Fields / JSON switch, shared by order and shipping operations. */
export function itemFields(kind: 'order' | 'shipping'): INodeProperties[] {
	const identifiers = kind === 'order' ? ORDER_ITEM_IDENTIFIERS : SHIPPING_ITEM_IDENTIFIERS;

	const values: INodeProperties[] = [];
	if (kind === 'order') {
		values.push({
			displayName: 'External Line ID',
			name: 'external_id',
			type: 'string',
			default: '',
			description: 'Your own reference for this line, for example the line ID in your store',
		});
	}
	values.push(
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			default: '',
			placeholder: 'e.g. 4012',
			description: 'The value of the identifier selected under Identify By',
		},
		{
			displayName: 'Identify By',
			name: 'identifyBy',
			type: 'options',
			default: 'variant_id',
			options: identifiers,
		},
	);
	if (kind === 'order') {
		values.push({
			displayName: 'Print Files',
			name: 'files',
			type: 'json',
			default: '',
			placeholder: '[{ "type": "default", "url": "https://example.com/front.png" }]',
			description:
				'Files to print, needed with a catalog variant ID. Each entry has a URL or a file ID and an optional type such as default (front), back or label_inside.',
		});
	}
	values.push({
		displayName: 'Quantity',
		name: 'quantity',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
	});
	if (kind === 'order') {
		values.push({
			displayName: 'Retail Price',
			name: 'retail_price',
			type: 'string',
			default: '',
			placeholder: 'e.g. 24.99',
			description: 'Price shown on the packing slip',
		});
	} else {
		values.push({
			displayName: 'Value',
			name: 'value',
			type: 'string',
			default: '',
			placeholder: 'e.g. 24.99',
			description: 'Retail value of the item, helps calculate customs',
		});
	}

	return [
		{
			displayName: 'Items Input',
			name: 'itemsMode',
			type: 'options',
			default: 'fields',
			options: [
				{ name: 'Fields', value: 'fields', description: 'Add each item with the form below' },
				{ name: 'JSON', value: 'json', description: 'Pass the Printful items array as JSON' },
			],
		},
		{
			displayName: 'Items',
			name: 'items',
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			placeholder: 'Add Item',
			default: {},
			required: true,
			displayOptions: { show: { itemsMode: ['fields'] } },
			options: [
				{
					name: 'item',
					displayName: 'Item',
					values,
				},
			],
		},
		{
			displayName: 'Items (JSON)',
			name: 'itemsJson',
			type: 'json',
			default: '[\n  { "variant_id": 0, "quantity": 1 }\n]',
			required: true,
			displayOptions: { show: { itemsMode: ['json'] } },
			description:
				'Printful items array, exactly as the API expects it. Orders also accept sync_variant_id, external_variant_id and product_template_id.',
		},
	];
}

/** Store product variants with a Fields / JSON switch (Product > Create). */
export const variantFields: INodeProperties[] = [
	{
		displayName: 'Variants Input',
		name: 'variantsMode',
		type: 'options',
		default: 'fields',
		options: [
			{ name: 'Fields', value: 'fields', description: 'Add each variant with the form below' },
			{ name: 'JSON', value: 'json', description: 'Pass the Printful sync_variants array as JSON' },
		],
	},
	{
		displayName: 'Variants',
		name: 'variants',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Variant',
		default: {},
		required: true,
		displayOptions: { show: { variantsMode: ['fields'] } },
		description: 'One entry per size or color you want to sell',
		options: [
			{
				name: 'variant',
				displayName: 'Variant',
				values: [
					{
						displayName: 'Catalog Variant ID',
						name: 'variant_id',
						type: 'number',
						default: 0,
						placeholder: 'e.g. 4012',
						description: 'The blank product variant from Catalog > Get Variants',
					},
					{
						displayName: 'External ID',
						name: 'external_id',
						type: 'string',
						default: '',
						description: 'The variant ID in your own system',
					},
					{
						displayName: 'Print File Type',
						name: 'fileType',
						type: 'string',
						default: 'default',
						description: 'Where the file is printed: default (front), back, label_inside, label_outside, sleeve_left ... as listed in Mockup > Get Printfiles.',
					},
					{
						displayName: 'Print File URL',
						name: 'fileUrl',
						type: 'string',
						default: '',
						placeholder: 'e.g. https://example.com/designs/front.png',
						description:
							'Public URL of the design file. Printful downloads it and stores it in the file library.',
					},
					{
						displayName: 'Retail Price',
						name: 'retail_price',
						type: 'string',
						default: '',
						placeholder: 'e.g. 24.99',
					},
					{
						displayName: 'SKU',
						name: 'sku',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Variants (JSON)',
		name: 'variantsJson',
		type: 'json',
		default:
			'[\n  { "variant_id": 4012, "retail_price": "24.99", "files": [ { "type": "default", "url": "https://example.com/front.png" } ] }\n]',
		required: true,
		displayOptions: { show: { variantsMode: ['json'] } },
		description: 'Printful sync_variants array, exactly as the API expects it',
	},
];
