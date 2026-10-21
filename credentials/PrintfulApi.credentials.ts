import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PrintfulApi implements ICredentialType {
	name = 'printfulApi';

	displayName = 'Printful API';

	icon: Icon = { light: 'file:../icons/printful.svg', dark: 'file:../icons/printful.dark.svg' };

	documentationUrl = 'https://github.com/amdrautomate/n8n-nodes-printful#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Private Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Create one at developers.printful.com under Private tokens. Give it the scopes you need (orders, stores, sync products, file library, webhooks).',
		},
		{
			displayName: 'Store ID',
			name: 'storeId',
			type: 'string',
			default: '',
			placeholder: 'e.g. 12345678',
			description:
				'Required for account-level tokens, which can see every store. Leave empty for a token created for one store. Find IDs with Store > Get Many.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
				'User-Agent': 'n8n-nodes-printful',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.printful.com',
			url: '/stores',
			method: 'GET',
			headers: {
				'User-Agent': 'n8n-nodes-printful',
			},
		},
	};
}
