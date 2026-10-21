import type { INodeProperties } from 'n8n-workflow';
import { catalogProductSelect } from '../shared/descriptions';
import { clientSideLimitProperties, rootProperty } from '../shared/routing';

const resource = ['catalog'];
const productBase = '=/products/{{$parameter.catalogProductId}}';

export const catalogDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get Category',
				value: 'getCategory',
				action: 'Get a catalog category',
				description: 'Get one catalog category',
				routing: {
					request: { method: 'GET', url: '=/categories/{{$parameter.categoryId}}' },
				},
			},
			{
				name: 'Get Many Categories',
				value: 'getAllCategories',
				action: 'Get many catalog categories',
				description: 'List the catalog categories (t-shirts, mugs, posters ...)',
				routing: {
					request: { method: 'GET', url: '/categories' },
				},
			},
			{
				name: 'Get Many Products',
				value: 'getAllProducts',
				action: 'Get many catalog products',
				description: 'List the blank products Printful can print on',
				routing: {
					request: { method: 'GET', url: '/products' },
				},
			},
			{
				name: 'Get Product',
				value: 'getProduct',
				action: 'Get a catalog product',
				description: 'Get a blank product with its print files, options and variants',
				routing: {
					request: { method: 'GET', url: productBase },
				},
			},
			{
				name: 'Get Size Guide',
				value: 'getSizeGuide',
				action: 'Get a catalog product size guide',
				description: 'Get the size tables of a blank product',
				routing: {
					request: { method: 'GET', url: `${productBase}/sizes` },
				},
			},
			{
				name: 'Get Variant',
				value: 'getVariant',
				action: 'Get a catalog variant',
				description: 'Get one size/color variant and its parent product',
				routing: {
					request: { method: 'GET', url: '=/products/variant/{{$parameter.variantId}}' },
				},
			},
			{
				name: 'Get Variants',
				value: 'getVariants',
				action: 'Get the variants of a catalog product',
				description: 'List the size/color variants of a blank product, one item per variant',
				routing: {
					request: { method: 'GET', url: productBase },
					output: { postReceive: [rootProperty('variants')] },
				},
			},
		],
		default: 'getAllProducts',
	},
	{
		...catalogProductSelect,
		displayOptions: {
			show: { resource, operation: ['getProduct', 'getVariants', 'getSizeGuide'] },
		},
	},
	{
		displayName: 'Variant ID',
		name: 'variantId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 4012',
		displayOptions: { show: { resource, operation: ['getVariant'] } },
	},
	{
		displayName: 'Category ID',
		name: 'categoryId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 24',
		displayOptions: { show: { resource, operation: ['getCategory'] } },
	},
	{
		displayName: 'Unit',
		name: 'unit',
		type: 'options',
		default: 'inches',
		options: [
			{ name: 'Centimeters', value: 'cm' },
			{ name: 'Inches', value: 'inches' },
		],
		displayOptions: { show: { resource, operation: ['getSizeGuide'] } },
		routing: { send: { type: 'query', property: 'unit' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource, operation: ['getAllProducts'] } },
		options: [
			{
				displayName: 'Category IDs',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: 'e.g. 24,25',
				description: 'Comma-separated category IDs, from Get Many Categories',
				routing: { send: { type: 'query', property: 'category_id' } },
			},
		],
	},
	...clientSideLimitProperties({ resource, operation: ['getAllProducts'] }),
	...clientSideLimitProperties({ resource, operation: ['getAllCategories'] }),
	...clientSideLimitProperties({ resource, operation: ['getVariants'] }),
];
