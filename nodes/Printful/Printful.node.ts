import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { catalogDescription } from './resources/catalog';
import { countryDescription } from './resources/country';
import { fileDescription } from './resources/file';
import { mockupDescription } from './resources/mockup';
import { orderDescription } from './resources/order';
import {
	platformProductDescription,
	platformVariantDescription,
} from './resources/platformProduct';
import { productDescription } from './resources/product';
import { productTemplateDescription } from './resources/productTemplate';
import { productVariantDescription } from './resources/productVariant';
import { shippingDescription } from './resources/shipping';
import { storeDescription } from './resources/store';
import { warehouseProductDescription } from './resources/warehouseProduct';
import { webhookDescription } from './resources/webhook';
import {
	getCatalogProducts,
	getPlatformProducts,
	getProductTemplates,
	getStoreProducts,
	getStores,
} from './listSearch';
import { withPrintfulDefaults } from './shared/routing';
import { PRINTFUL_BASE_URL, USER_AGENT } from './shared/transport';

export class Printful implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Printful',
		name: 'printful',
		icon: { light: 'file:../../icons/printful.svg', dark: 'file:../../icons/printful.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description:
			'Manage print-on-demand products, orders, print files, mockups, shipping rates and webhooks in Printful',
		defaults: {
			name: 'Printful',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'printfulApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: PRINTFUL_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': USER_AGENT,
			},
			// Errors are raised by handlePrintfulResponse with Printful's own reason text.
			ignoreHttpStatusErrors: true,
		},
		properties: withPrintfulDefaults([
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Catalog', value: 'catalog' },
					{ name: 'Country', value: 'country' },
					{ name: 'File', value: 'file' },
					{ name: 'Mockup', value: 'mockup' },
					{ name: 'Order', value: 'order' },
					{ name: 'Platform Product', value: 'platformProduct' },
					{ name: 'Platform Variant', value: 'platformVariant' },
					{ name: 'Product', value: 'product' },
					{ name: 'Product Template', value: 'productTemplate' },
					{ name: 'Product Variant', value: 'productVariant' },
					{ name: 'Shipping', value: 'shipping' },
					{ name: 'Store', value: 'store' },
					{ name: 'Warehouse Product', value: 'warehouseProduct' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'product',
			},
			...catalogDescription,
			...countryDescription,
			...fileDescription,
			...mockupDescription,
			...orderDescription,
			...platformProductDescription,
			...platformVariantDescription,
			...productDescription,
			...productTemplateDescription,
			...productVariantDescription,
			...shippingDescription,
			...storeDescription,
			...warehouseProductDescription,
			...webhookDescription,
		]),
	};

	methods = {
		listSearch: {
			getCatalogProducts,
			getPlatformProducts,
			getProductTemplates,
			getStoreProducts,
			getStores,
		},
	};
}
