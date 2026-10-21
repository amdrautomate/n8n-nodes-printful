import type { INodeProperties } from 'n8n-workflow';
import { clientSideLimitProperties } from '../shared/routing';

const resource = ['country'];

export const countryDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many countries',
				description: 'List the countries and states Printful ships to, with their codes',
				routing: {
					request: { method: 'GET', url: '/countries' },
				},
			},
		],
		default: 'getAll',
	},
	...clientSideLimitProperties({ resource, operation: ['getAll'] }),
];
