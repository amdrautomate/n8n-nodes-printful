import type { INodeProperties } from 'n8n-workflow';
import { productSelect } from '../shared/descriptions';
import {
	buildVariantCreateBody,
	buildVariantUpdateBody,
	deletedOutput,
} from '../shared/routing';

const resource = ['productVariant'];
const variantBase = '=/store/variants/{{$parameter.variantId}}';

export const productVariantDescription: INodeProperties[] = [
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
				action: 'Create a product variant',
				description: 'Add a size/color variant with its print file to an existing product',
				routing: {
					request: { method: 'POST', url: '=/store/products/{{$parameter.productId}}/variants' },
					send: { preSend: [buildVariantCreateBody] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a product variant',
				description: 'Remove one variant from a product',
				routing: {
					request: { method: 'DELETE', url: variantBase },
					output: { postReceive: [deletedOutput] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product variant',
				description: 'Get one variant of a store product',
				routing: {
					request: { method: 'GET', url: variantBase },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a product variant',
				description: 'Change the catalog variant, price, SKU or print files of a variant',
				routing: {
					request: { method: 'PUT', url: variantBase },
					send: { preSend: [buildVariantUpdateBody] },
				},
			},
		],
		default: 'get',
	},
	{
		...productSelect,
		displayOptions: { show: { resource, operation: ['create'] } },
	},
	{
		displayName: 'Variant ID',
		name: 'variantId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 2345678 or @my-external-ID',
		description: 'Store variant ID, or your external ID prefixed with @',
		displayOptions: { show: { resource, operation: ['delete', 'get', 'update'] } },
	},

	// ---- Create ----
	{
		displayName: 'Catalog Variant ID',
		name: 'catalogVariantId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 4012',
		description: 'The blank product variant from Catalog > Get Variants',
		displayOptions: { show: { resource, operation: ['create'] } },
	},
	{
		displayName: 'Print File URL',
		name: 'fileUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/designs/front.png',
		description: 'Public URL of the design file. Printful downloads it and stores it in the file library.',
		displayOptions: { show: { resource, operation: ['create'] } },
	},
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
			},
			{
				displayName: 'Options (JSON)',
				name: 'options',
				type: 'json',
				default: '',
				placeholder: '[{ "ID": "thread_colors", "value": ["#FFFFFF"] }]',
				description: 'Product options such as embroidery thread colors',
			},
			{
				displayName: 'Print File Type',
				name: 'fileType',
				type: 'string',
				default: 'default',
				description: 'Placement of the print file: default (front), back, label_inside',
			},
			{
				displayName: 'Print Files (JSON)',
				name: 'files',
				type: 'json',
				default: '',
				placeholder: '[{ "type": "default", "url": "..." }, { "type": "back", "url": "..." }]',
				description: 'Replaces Print File URL when a variant needs several files',
			},
			{
				displayName: 'Retail Price',
				name: 'retailPrice',
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
				displayName: 'Catalog Variant ID',
				name: 'catalogVariantId',
				type: 'number',
				default: 0,
			},
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
