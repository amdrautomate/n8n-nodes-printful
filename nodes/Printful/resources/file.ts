import type { INodeProperties } from 'n8n-workflow';

const resource = ['file'];

export const fileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Add',
				value: 'add',
				action: 'Add a file',
				description:
					'Add a print file to the file library from a public URL (a file with the same URL is reused)',
				routing: {
					request: { method: 'POST', url: '/files' },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a file',
				description: 'Get a file with its processing status, size and preview URL',
				routing: {
					request: { method: 'GET', url: '=/files/{{$parameter.fileId}}' },
				},
			},
		],
		default: 'add',
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 123456',
		displayOptions: { show: { resource, operation: ['get'] } },
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/designs/front.png',
		description: 'Public URL Printful downloads the file from. PNG, JPG and PDF are safest.',
		displayOptions: { show: { resource, operation: ['add'] } },
		routing: { send: { type: 'body', property: 'url' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['add'] } },
		options: [
			{
				displayName: 'Filename',
				name: 'filename',
				type: 'string',
				default: '',
				description: 'Name shown in the file library',
				routing: { send: { type: 'body', property: 'filename' } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'string',
				default: 'default',
				description: 'Role of the file: default (front print), back, preview, label_inside',
				routing: { send: { type: 'body', property: 'type' } },
			},
			{
				displayName: 'Visible',
				name: 'visible',
				type: 'boolean',
				default: true,
				description: 'Whether the file shows up in the file library in the Printful dashboard',
				routing: { send: { type: 'body', property: 'visible' } },
			},
		],
	},
];
