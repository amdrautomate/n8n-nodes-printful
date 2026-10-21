import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../shared/routing';

const resource = ['warehouseProduct'];

export const warehouseProductDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a warehouse product',
				description: 'Get a product stored in a Printful warehouse, with its variants and stock',
				routing: {
					request: {
						method: 'GET',
						url: '=/warehouse/products/{{$parameter.warehouseProductId}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many warehouse products',
				description: 'List the products stored in Printful warehouses',
				routing: {
					request: {
						method: 'GET',
						url: '/warehouse/products',
						headers: { 'X-PF-Force-Pagination': '1' },
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Warehouse Product ID',
		name: 'warehouseProductId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456',
		displayOptions: { show: { resource, operation: ['get'] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Name Contains',
				name: 'query',
				type: 'string',
				default: '',
				routing: { send: { type: 'query', property: 'query' } },
			},
		],
	},
	...paginationProperties({ resource, operation: ['getAll'] }),
];
