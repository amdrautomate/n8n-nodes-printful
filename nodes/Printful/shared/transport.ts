import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const PRINTFUL_BASE_URL = 'https://api.printful.com';
export const USER_AGENT = 'n8n-nodes-printful';

type Context = IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions;

/** The optional store header for account-level tokens, read from the credential. */
export async function storeHeader(this: Context): Promise<IDataObject> {
	const credentials = (await this.getCredentials('printfulApi')) as { storeId?: string };
	const storeId = String(credentials.storeId ?? '').trim();
	return storeId ? { 'X-PF-Store-Id': storeId } : {};
}

/**
 * Authenticated request against the Printful API that returns the `result` of the
 * `{ code, result, paging }` envelope. Used by list searches and the trigger;
 * the action node routes declaratively.
 */
export async function printfulApiRequest(
	this: Context,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
): Promise<IDataObject | IDataObject[]> {
	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: `${PRINTFUL_BASE_URL}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'User-Agent': USER_AGENT,
			...(await storeHeader.call(this)),
		},
		json: true,
	};

	if (body === undefined) {
		delete options.body;
	}

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'printfulApi',
		options,
	)) as { result?: IDataObject | IDataObject[] };
	return response?.result ?? {};
}

/** Like printfulApiRequest but keeps the envelope, for callers that need `paging`. */
export async function printfulApiRequestRaw(
	this: Context,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
): Promise<{ result: IDataObject[]; paging?: { total: number; offset: number; limit: number } }> {
	const options: IHttpRequestOptions = {
		method,
		qs,
		url: `${PRINTFUL_BASE_URL}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'User-Agent': USER_AGENT,
			...(await storeHeader.call(this)),
		},
		json: true,
	};
	return (await this.helpers.httpRequestWithAuthentication.call(this, 'printfulApi', options)) as {
		result: IDataObject[];
		paging?: { total: number; offset: number; limit: number };
	};
}
