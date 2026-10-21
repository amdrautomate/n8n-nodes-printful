import type { INodeProperties } from 'n8n-workflow';
import {
	itemFields,
	ORDER_STATUSES,
	recipientFields,
	simplifyToggle,
} from '../shared/descriptions';
import {
	buildOrderBody,
	buildOrderUpdateBody,
	paginationProperties,
	simplifyOrder,
} from '../shared/routing';

const resource = ['order'];
const orderBase = '=/orders/{{$parameter.orderId}}';

export const orderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel an order',
				description: 'Cancel a draft or pending order; charged amounts are refunded',
				routing: {
					request: { method: 'DELETE', url: orderBase },
					output: { postReceive: [simplifyOrder] },
				},
			},
			{
				name: 'Confirm',
				value: 'confirm',
				action: 'Confirm an order',
				description: 'Submit a draft order for fulfillment (this charges the store)',
				routing: {
					request: { method: 'POST', url: `${orderBase}/confirm` },
					output: { postReceive: [simplifyOrder] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an order',
				description: 'Create an order as a draft, or confirm it right away',
				routing: {
					request: { method: 'POST', url: '/orders' },
					send: { preSend: [buildOrderBody] },
					output: { postReceive: [simplifyOrder] },
				},
			},
			{
				name: 'Estimate Costs',
				value: 'estimateCosts',
				action: 'Estimate order costs',
				description: 'Calculate item, print, shipping and tax costs without creating an order',
				routing: {
					request: { method: 'POST', url: '/orders/estimate-costs' },
					send: { preSend: [buildOrderBody] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an order',
				description: 'Get an order with its items, costs and shipments',
				routing: {
					request: { method: 'GET', url: orderBase },
					output: { postReceive: [simplifyOrder] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many orders',
				description: 'List the orders of the store',
				routing: {
					request: { method: 'GET', url: '/orders' },
					output: { postReceive: [simplifyOrder] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an order',
				description: 'Change a draft or failed order, optionally confirming it',
				routing: {
					request: { method: 'PUT', url: orderBase },
					send: { preSend: [buildOrderUpdateBody] },
					output: { postReceive: [simplifyOrder] },
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 13 or @my-order-ID',
		description: 'Printful order ID, or your external ID prefixed with @',
		displayOptions: { show: { resource, operation: ['cancel', 'confirm', 'get', 'update'] } },
	},

	// ---- Create / Estimate ----
	{
		...recipientFields,
		displayOptions: { show: { resource, operation: ['create', 'estimateCosts'] } },
	},
	...itemFields('order').map((property) => ({
		...property,
		displayOptions: {
			show: {
				resource,
				operation: ['create', 'estimateCosts'],
				...(property.displayOptions?.show ?? {}),
			},
		},
	})),
	{
		displayName: 'Confirm',
		name: 'confirm',
		type: 'boolean',
		default: false,
		description:
			'Whether to submit the order for fulfillment immediately instead of leaving it as a draft. Confirming charges the store.',
		displayOptions: { show: { resource, operation: ['create', 'update'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['create', 'estimateCosts'] } },
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Your own order ID, usable later with an @ prefix',
			},
			{
				displayName: 'Gift Message',
				name: 'giftMessage',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Gift Subject',
				name: 'giftSubject',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Packing Slip (JSON)',
				name: 'packingSlip',
				type: 'json',
				default: '',
				placeholder: '{ "email": "support@example.com", "message": "Thanks!" }',
			},
			{
				displayName: 'Retail Costs (JSON)',
				name: 'retailCosts',
				type: 'json',
				default: '',
				placeholder: '{ "currency": "USD", "subtotal": "24.99", "shipping": "4.99" }',
				description: 'Retail amounts printed on the packing slip of international shipments',
			},
			{
				displayName: 'Shipping Method',
				name: 'shipping',
				type: 'string',
				default: '',
				placeholder: 'e.g. STANDARD',
				description: 'A rate ID from Shipping > Calculate Rates. Defaults to STANDARD.',
			},
			{
				displayName: 'Update Existing',
				name: 'updateExisting',
				type: 'boolean',
				default: false,
				description: 'Whether to update an existing order that has the same external ID',
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
				displayName: 'Gift Message',
				name: 'giftMessage',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Gift Subject',
				name: 'giftSubject',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Items (JSON)',
				name: 'items',
				type: 'json',
				default: '',
				placeholder: '[{ "sync_variant_id": 123, "quantity": 2 }]',
				description: 'Replaces every item of the order',
			},
			{
				displayName: 'Recipient (JSON)',
				name: 'recipient',
				type: 'json',
				default: '',
				placeholder: '{ "name": "Ada Lovelace", "address1": "...", "country_code": "US" }',
			},
			{
				displayName: 'Shipping Method',
				name: 'shipping',
				type: 'string',
				default: '',
				placeholder: 'e.g. STANDARD',
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
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'pending',
				options: ORDER_STATUSES,
				routing: { send: { type: 'query', property: 'status' } },
			},
		],
	},
	...paginationProperties({ resource, operation: ['getAll'] }),
	{
		...simplifyToggle,
		displayOptions: {
			show: { resource, operation: ['cancel', 'confirm', 'create', 'get', 'getAll', 'update'] },
		},
	},
];
