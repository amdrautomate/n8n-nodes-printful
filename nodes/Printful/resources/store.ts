import type { INodeProperties } from 'n8n-workflow';
import { storeSelect } from '../shared/descriptions';

const resource = ['store'];

export const storeDescription: INodeProperties[] = [
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
				action: 'Get a store',
				description: 'Get the ID, type and name of a store',
				routing: {
					request: { method: 'GET', url: '=/stores/{{$parameter.storeId}}' },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many stores',
				description: 'List the stores the token can access',
				routing: {
					request: { method: 'GET', url: '/stores' },
				},
			},
		],
		default: 'getAll',
	},
	{
		...storeSelect,
		displayOptions: { show: { resource, operation: ['get'] } },
	},
];
