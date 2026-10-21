import type { INodeProperties } from 'n8n-workflow';
import { catalogProductSelect } from '../shared/descriptions';
import { buildMockupTaskBody, waitForMockupTask } from '../shared/routing';

const resource = ['mockup'];
const productBase = '=/mockup-generator';

export const mockupDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Create Task',
				value: 'createTask',
				action: 'Create a mockup task',
				description:
					'Render product mockups from design files or a product template (10 tasks per minute)',
				routing: {
					request: {
						method: 'POST',
						url: `${productBase}/create-task/{{$parameter.catalogProductId}}`,
					},
					send: { preSend: [buildMockupTaskBody] },
					output: { postReceive: [waitForMockupTask] },
				},
			},
			{
				name: 'Get Printfiles',
				value: 'getPrintfiles',
				action: 'Get the printfiles of a catalog product',
				description:
					'Get the placements, print areas and file sizes a product accepts (front, back, sleeves ...)',
				routing: {
					request: {
						method: 'GET',
						url: `${productBase}/printfiles/{{$parameter.catalogProductId}}`,
					},
				},
			},
			{
				name: 'Get Task',
				value: 'getTask',
				action: 'Get a mockup task',
				description: 'Get the status and, once completed, the mockup image URLs of a task',
				routing: {
					request: {
						method: 'GET',
						url: `${productBase}/task`,
						qs: { task_key: '={{ $parameter.taskKey }}' },
					},
				},
			},
			{
				name: 'Get Templates',
				value: 'getTemplates',
				action: 'Get the layout templates of a catalog product',
				description: 'Get the mockup layout templates and print areas for client-side positioning',
				routing: {
					request: {
						method: 'GET',
						url: `${productBase}/templates/{{$parameter.catalogProductId}}`,
					},
				},
			},
		],
		default: 'createTask',
	},
	{
		...catalogProductSelect,
		displayOptions: {
			show: { resource, operation: ['createTask', 'getPrintfiles', 'getTemplates'] },
		},
	},
	{
		displayName: 'Task Key',
		name: 'taskKey',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. gt-123456789',
		displayOptions: { show: { resource, operation: ['getTask'] } },
	},

	// ---- Create Task ----
	{
		displayName: 'Variant IDs',
		name: 'variantIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 4012,4013',
		description: 'Comma-separated catalog variant IDs to render',
		displayOptions: { show: { resource, operation: ['createTask'] } },
	},
	{
		displayName: 'Design Source',
		name: 'source',
		type: 'options',
		default: 'files',
		displayOptions: { show: { resource, operation: ['createTask'] } },
		options: [
			{ name: 'Files', value: 'files', description: 'Design files placed on the product' },
			{ name: 'Product Template', value: 'template', description: 'A saved product template' },
		],
	},
	{
		displayName: 'Files',
		name: 'files',
		type: 'json',
		default:
			'[\n  { "placement": "front", "image_url": "https://example.com/designs/front.png" }\n]',
		required: true,
		displayOptions: { show: { resource, operation: ['createTask'], source: ['files'] } },
		description:
			'One entry per placement, with the public image URL and optionally a position object (area_width, area_height, width, height, top, left) from Get Printfiles',
	},
	{
		displayName: 'Product Template ID',
		name: 'productTemplateId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: { resource, operation: ['createTask'], source: ['template'] } },
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		default: 'jpg',
		displayOptions: { show: { resource, operation: ['createTask'] } },
		options: [
			{ name: 'JPG', value: 'jpg', description: 'Smaller files' },
			{ name: 'PNG', value: 'png', description: 'Transparent background' },
		],
	},
	{
		displayName: 'Wait for Completion',
		name: 'waitForCompletion',
		type: 'boolean',
		default: true,
		description:
			'Whether to wait until the mockups are rendered and return them, instead of returning the pending task',
		displayOptions: { show: { resource, operation: ['createTask'] } },
	},
	{
		displayName: 'Max Wait (Seconds)',
		name: 'maxWaitSeconds',
		type: 'number',
		default: 120,
		typeOptions: { minValue: 5 },
		displayOptions: { show: { resource, operation: ['createTask'], waitForCompletion: [true] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['createTask'] } },
		options: [
			{
				displayName: 'Option Groups',
				name: 'optionGroups',
				type: 'string',
				default: '',
				placeholder: 'e.g. Flat,Lifestyle',
				description: 'Comma-separated mockup style groups, from Get Printfiles',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'string',
				default: '',
				placeholder: "e.g. Front,Men's",
				description: 'Comma-separated mockup options, from Get Printfiles',
			},
			{
				displayName: 'Product Options (JSON)',
				name: 'productOptions',
				type: 'json',
				default: '',
				placeholder: '{ "thread_colors": ["#FFFFFF"] }',
				description: 'Product options such as embroidery thread colors',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'printfileOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource, operation: ['getPrintfiles', 'getTemplates'] } },
		options: [
			{
				displayName: 'Orientation',
				name: 'orientation',
				type: 'options',
				default: 'horizontal',
				options: [
					{ name: 'Horizontal', value: 'horizontal' },
					{ name: 'Vertical', value: 'vertical' },
				],
				description: 'For products such as posters that come in both orientations',
				routing: { send: { type: 'query', property: 'orientation' } },
			},
			{
				displayName: 'Technique',
				name: 'technique',
				type: 'string',
				default: '',
				placeholder: 'e.g. EMBROIDERY',
				description: 'Printing technique; defaults to DTG for products that support several',
				routing: { send: { type: 'query', property: 'technique' } },
			},
		],
	},
];
