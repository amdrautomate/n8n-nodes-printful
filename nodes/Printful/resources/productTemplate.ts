import type { INodeProperties } from 'n8n-workflow';
import { productTemplateSelect } from '../shared/descriptions';
import { paginationProperties, rootProperty } from '../shared/routing';

const resource = ['productTemplate'];
const templateBase = '=/product-templates/{{$parameter.templateId}}';

export const productTemplateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a product template',
				description: 'Delete a product template saved in the Printful dashboard',
				routing: {
					request: { method: 'DELETE', url: templateBase },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product template',
				description: 'Get a template with its placements, colors, sizes and mockup URL',
				routing: {
					request: { method: 'GET', url: templateBase },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many product templates',
				description: 'List the product templates saved in the Printful dashboard',
				routing: {
					request: { method: 'GET', url: '/product-templates' },
					output: { postReceive: [rootProperty('items')] },
				},
			},
		],
		default: 'getAll',
	},
	{
		...productTemplateSelect,
		displayOptions: { show: { resource, operation: ['delete', 'get'] } },
	},
	...paginationProperties({ resource, operation: ['getAll'] }),
];
