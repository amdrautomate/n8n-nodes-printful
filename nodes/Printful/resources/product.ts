import type { INodeProperties } from 'n8n-workflow';
import { productSelect, PRODUCT_STATUSES, variantFields } from '../shared/descriptions';
import {
	buildProductCreateBody,
	buildProductUpdateBody,
	deletedOutput,
	paginationProperties,
} from '../shared/routing';

const resource = ['product'];
const productBase = '=/store/products/{{$parameter.productId}}';

export const productDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a product',
				description:
					'Create a product with its variants and print files in a Manual order / API store',
				routing: {
					request: { method: 'POST', url: '/store/products' },
					send: { preSend: [buildProductCreateBody] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a product',
				description: 'Delete a product and all of its variants',
				routing: {
					request: { method: 'DELETE', url: productBase },
					output: { postReceive: [deletedOutput] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product',
				description: 'Get a product with its variants',
				routing: {
					request: { method: 'GET', url: productBase },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many products',
				description: 'List the products of the store',
				routing: {
					request: { method: 'GET', url: '/store/products' },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a product',
				description: 'Change the name, thumbnail, external ID or variants of a product',
				routing: {
					request: { method: 'PUT', url: productBase },
					send: { preSend: [buildProductUpdateBody] },
				},
			},
		],
		default: 'getAll',
	},
	{
		...productSelect,
		displayOptions: { show: { resource, operation: ['delete', 'get', 'update'] } },
	},

	// ---- Create ----
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. Sunrise Logo Tee',
		displayOptions: { show: { resource, operation: ['create'] } },
	},
	...variantFields.map((property) => ({
		...property,
		displayOptions: {
			show: { resource, operation: ['create'], ...(property.displayOptions?.show ?? {}) },
		},
	})),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['create'] } },
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'The product ID in your own system, usable later with an @ prefix',
			},
			{
				displayName: 'Thumbnail URL',
				name: 'thumbnail',
				type: 'string',
				default: '',
				placeholder: 'e.g. https://example.com/mockups/tee.png',
				description: 'Public image shown for the product in the Printful dashboard',
			},
		],
	},

	// ---- Update ----
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['update'] } },
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Ignored',
				name: 'isIgnored',
				type: 'boolean',
				default: false,
				description: 'Whether Printful should ignore this product when importing orders',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Thumbnail URL',
				name: 'thumbnail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Variants (JSON)',
				name: 'syncVariants',
				type: 'json',
				default: '',
				placeholder: '[{ "ID": 123, "retail_price": "29.99" }]',
				description:
					'Sync variants to change. Entries with an ID update that variant; entries without one are created; variants left out are deleted.',
			},
		],
	},

	// ---- Get Many ----
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Category IDs',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: 'e.g. 24,25',
				description: 'Comma-separated catalog category IDs',
				routing: { send: { type: 'query', property: 'category_id' } },
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
	...paginationProperties({ resource, operation: ['getAll'] }),
];
