import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { WEBHOOK_EVENTS } from '../Printful/shared/descriptions';
import { printfulApiRequest } from '../Printful/shared/transport';

type WebhookConfig = { url?: string | null; types?: string[]; params?: IDataObject };

function eventList(this: IHookFunctions): string[] {
	const events = this.getNodeParameter('events', []) as string[];
	if (events.length === 0) {
		throw new NodeOperationError(this.getNode(), "Select at least one event under 'Events'");
	}
	return events;
}

export class PrintfulTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Printful Trigger',
		name: 'printfulTrigger',
		icon: { light: 'file:../../icons/printful.svg', dark: 'file:../../icons/printful.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{ $parameter["events"].join(", ") }}',
		description: 'Starts the workflow when an order, package, product or stock changes in Printful',
		defaults: {
			name: 'Printful Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'printfulApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'A Printful store has one webhook URL. Activating this trigger points it at this workflow and replaces any webhook configured before, so put every event you need into this one node.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['order_created'],
				options: WEBHOOK_EVENTS,
				description: 'The Printful events that start this workflow',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Stock Updated Product IDs',
						name: 'stockProductIds',
						type: 'string',
						default: '',
						placeholder: 'e.g. 71,19',
						description:
							'Comma-separated catalog product IDs to watch; required for the Stock Updated event',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = eventList.call(this);
				const config = (await printfulApiRequest.call(this, 'GET', '/webhooks')) as WebhookConfig;
				if (!config.url || config.url !== webhookUrl) return false;
				const registered = new Set(config.types ?? []);
				return events.every((event) => registered.has(event));
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = eventList.call(this);
				const options = this.getNodeParameter('options', {}) as { stockProductIds?: string };
				const body: IDataObject = { url: webhookUrl, types: events };
				const productIds = String(options.stockProductIds ?? '')
					.split(',')
					.map((id) => Number(id.trim()))
					.filter((id) => Number.isFinite(id) && id > 0);
				if (events.includes('stock_updated') && productIds.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						"'Stock Updated Product IDs' is required for the Stock Updated event",
					);
				}
				if (productIds.length > 0) {
					body.params = { stock_updated: { product_ids: productIds } };
				}
				await printfulApiRequest.call(this, 'POST', '/webhooks', {}, body);
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				try {
					const config = (await printfulApiRequest.call(this, 'GET', '/webhooks')) as WebhookConfig;
					// Only remove the configuration if it still points at this workflow.
					if (config.url === webhookUrl) {
						await printfulApiRequest.call(this, 'DELETE', '/webhooks');
					}
				} catch (error) {
					this.logger.warn(
						`Printful Trigger: could not disable the webhook: ${(error as Error).message}`,
					);
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events', []) as string[];
		// Printful posts every enabled type to the one URL; ignore types this node did not ask for.
		if (typeof body.type === 'string' && events.length > 0 && !events.includes(body.type)) {
			return {};
		}
		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
