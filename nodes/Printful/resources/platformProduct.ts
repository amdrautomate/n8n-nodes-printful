import type { INodeProperties } from 'n8n-workflow';
import { platformProductSelect, PRODUCT_STATUSES } from '../shared/descriptions';
import { buildVariantUpdateBody, deletedOutput, paginationProperties } from '../shared/routing';

const productResource = ['platformProduct'];
const variantResource = ['platformVariant'];
const productBase = '=/sync/products/{{$parameter.platformProductId}}';
const variantBase = '=/sync/variant/{{$parameter.variantId}}';

/** Products imported from a connected ecommerce platform (Shopify, Etsy, WooCommerce ...). */
export const platformProductDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: productResource } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a platform product',
				description: 'Remove the Printful configuration of a platform product and its variants',
				routing: {
					request: { method: 'DELETE', url: productBase },
					output: { postReceive: [deletedOutput] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a platform product',
				description: 'Get a platform product with its variants',
				routing: {
					request: { method: 'GET', url: productBase },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many platform products',
				description: 'List the products imported from the connected ecommerce platform',
				routing: {
					request: { method: 'GET', url: '/sync/products' },
				},
			},
		],
		default: 'getAll',
	},
	{
		...platformProductSelect,
		displayOptions: { show: { resource: productResource, operation: ['delete', 'get'] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: productResource, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Only products whose name contains this text',
				routing: { send: { type: 'query', property: 'search' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'all',
				options: PRODUCT_STATUSES,
				routing: { send: { type: 'query', property: 'status' } },
			},
		],
	},
	...paginationProperties({ resource: productResource, operation: ['getAll'] }),
];

/** Variants of platform products: link them to catalog variants and print files. */
export const platformVariantDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: variantResource } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a platform variant configuration',
				description:
					'Remove the catalog variant, print files and options and stop importing orders for it',
				routing: {
					request: { method: 'DELETE', url: variantBase },
					output: { postReceive: [deletedOutput] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a platform variant',
				description: 'Get one platform variant and its product',
				routing: {
					request: { method: 'GET', url: variantBase },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a platform variant',
				description: 'Link a platform variant to a catalog variant, price, SKU and print files',
				routing: {
					request: { method: 'PUT', url: variantBase },
					send: { preSend: [buildVariantUpdateBody] },
				},
			},
		],
		default: 'get',
	},
	{
		displayName: 'Variant ID',
		name: 'variantId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 2345678 or @shopify-variant-ID',
		description: 'Printful sync variant ID, or the platform variant ID prefixed with @',
		displayOptions: { show: { resource: variantResource } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: variantResource, operation: ['update'] } },
		options: [
			{
				displayName: 'Catalog Variant ID',
				name: 'catalogVariantId',
				type: 'number',
				default: 0,
				description: 'The blank product variant to print, from Catalog > Get Variants',
			},
			{
				displayName: 'Ignored',
				name: 'isIgnored',
				type: 'boolean',
				default: false,
				description: 'Whether Printful should ignore this variant when importing orders',
			},
			{
				displayName: 'Options (JSON)',
				name: 'options',
				type: 'json',
				default: '',
			},
			{
				displayName: 'Print Files (JSON)',
				name: 'files',
				type: 'json',
				default: '',
				placeholder: '[{ "type": "default", "url": "https://example.com/front.png" }]',
			},
			{
				displayName: 'Retail Price',
				name: 'retailPrice',
				type: 'string',
				default: '',
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
			},
		],
	},
];
