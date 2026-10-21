import type { INodeProperties } from 'n8n-workflow';
import { WEBHOOK_EVENTS } from '../shared/descriptions';
import { buildWebhookBody, successOutput } from '../shared/routing';

const resource = ['webhook'];

export const webhookDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Disable',
				value: 'disable',
				action: 'Disable the webhook',
				description: 'Remove the webhook URL and every event type from the store',
				routing: {
					request: { method: 'DELETE', url: '/webhooks' },
					output: { postReceive: [successOutput] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get the webhook configuration',
				description: 'Get the URL and event types currently configured for the store',
				routing: {
					request: { method: 'GET', url: '/webhooks' },
				},
			},
			{
				name: 'Set',
				value: 'set',
				action: 'Set the webhook configuration',
				description:
					'Point the store webhook at a URL and choose the events. A store has one webhook URL, so this replaces the previous configuration.',
				routing: {
					request: { method: 'POST', url: '/webhooks' },
					send: { preSend: [buildWebhookBody] },
				},
			},
		],
		default: 'get',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/webhooks/printful',
		description: 'The HTTPS URL Printful posts events to',
		displayOptions: { show: { resource, operation: ['set'] } },
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		default: ['order_created'],
		required: true,
		options: WEBHOOK_EVENTS,
		displayOptions: { show: { resource, operation: ['set'] } },
	},
	{
		displayName: 'Stock Updated Product IDs',
		name: 'stockProductIds',
		type: 'string',
		default: '',
		placeholder: 'e.g. 71,19',
		description:
			'Comma-separated catalog product IDs to watch; only needed with the Stock Updated event',
		displayOptions: { show: { resource, operation: ['set'] } },
	},
];
