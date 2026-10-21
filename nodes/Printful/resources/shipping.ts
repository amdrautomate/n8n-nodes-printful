import type { INodeProperties } from 'n8n-workflow';
import { itemFields, shippingRecipientFields } from '../shared/descriptions';
import { buildShippingRatesBody } from '../shared/routing';

const resource = ['shipping'];

export const shippingDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Calculate Rates',
				value: 'calculateRates',
				action: 'Calculate shipping rates',
				description:
					'Get the available shipping methods, prices and delivery estimates for a destination and items',
				routing: {
					request: { method: 'POST', url: '/shipping/rates' },
					send: { preSend: [buildShippingRatesBody] },
				},
			},
		],
		default: 'calculateRates',
	},
	{
		...shippingRecipientFields,
		displayOptions: { show: { resource, operation: ['calculateRates'] } },
	},
	...itemFields('shipping').map((property) => ({
		...property,
		displayOptions: {
			show: {
				resource,
				operation: ['calculateRates'],
				...(property.displayOptions?.show ?? {}),
			},
		},
	})),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['calculateRates'] } },
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				placeholder: 'e.g. EUR',
				description: 'Three-letter code to convert the rates into; defaults to the store currency',
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				default: '',
				placeholder: 'e.g. es_ES',
				description: 'Language of the rate names; defaults to en_US',
			},
		],
	},
];
