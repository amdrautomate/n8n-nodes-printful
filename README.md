# n8n-nodes-printful

An [n8n](https://n8n.io) community node for [Printful](https://www.printful.com), the print-on-demand and warehousing platform. Create products from your designs, place and track orders, render mockups, quote shipping, and react to Printful events — all from your workflows, and as tools for AI agents.

Package: `@amdrautomate/n8n-nodes-printful` · Author: [AMDR Automate](https://amdrautomate.ai) · License: MIT

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

Self-hosted: **Settings → Community nodes → Install** and enter `@amdrautomate/n8n-nodes-printful`.

To let AI agents use the node as a tool on self-hosted n8n, set `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`.

## Credentials

The node authenticates with a Printful **private token** (Bearer).

1. Sign in to [developers.printful.com](https://developers.printful.com) with your Printful account.
2. Open **Private tokens → Add new token**, pick a name, the **scopes** (orders, stores, sync products, file library, webhooks) and an **expiration**.
3. Choose the **access level**:
   - **Store** – the token belongs to one store. Leave **Store ID** empty in n8n.
   - **Account** – the token sees every store. Enter the **Store ID** in n8n (find it with *Store → Get Many*). The node sends it as the `X-PF-Store-Id` header on every request.
4. Paste the token into the **Printful API** credential in n8n and click **Test**. The test lists your stores.

Private tokens expire on the date you chose and cannot be refreshed; create a new one and update the credential before then.

## Printful node

| Resource | Operations |
| --- | --- |
| **Catalog** | Get Many Products, Get Product, Get Variants, Get Variant, Get Size Guide, Get Many Categories, Get Category |
| **Country** | Get Many (country and state codes accepted for shipping) |
| **File** | Add (from a public URL), Get |
| **Mockup** | Create Task (optionally waits for the rendered mockups), Get Task, Get Printfiles, Get Templates |
| **Order** | Create (draft or confirmed), Get, Get Many, Update, Confirm, Cancel, Estimate Costs |
| **Platform Product** | Get Many, Get, Delete — products imported from Shopify, Etsy, WooCommerce and other connected platforms |
| **Platform Variant** | Get, Update (link to a catalog variant, price, SKU, print files), Delete |
| **Product** | Create, Get, Get Many, Update, Delete — products of a *Manual order / API* store |
| **Product Template** | Get Many, Get, Delete |
| **Product Variant** | Create, Get, Update, Delete |
| **Shipping** | Calculate Rates |
| **Store** | Get Many, Get |
| **Warehouse Product** | Get Many, Get |
| **Webhook** | Get, Set, Disable |

Notes:

- **Products vs Platform Products.** Printful keeps two product lists. *Product* works on stores of type *Manual order / API* (products you create through the API). *Platform Product* works on products imported from a connected ecommerce platform, where you only link variants to catalog variants and print files.
- IDs accept your own identifiers prefixed with `@` wherever Printful supports external IDs (products, variants, orders, templates).
- *Order → Create* leaves the order as a **draft** unless **Confirm** is on. Confirming charges the store's payment method.
- Every "Get Many" supports **Return All** or a **Limit**. Printful pages with `offset`/`limit`; the node handles that for you.
- Printful's general rate limit is 120 requests per minute; mockup tasks are limited to 10 per minute. Errors come back with Printful's own reason text.

### Example: design → product → mockup

1. **File → Add** with the public URL of your design (or skip this and pass the URL directly).
2. **Catalog → Get Variants** for a catalog product (for example 71, the Bella + Canvas 3001 tee) to pick variant IDs.
3. **Product → Create** with a name and one variant per size/color: catalog variant ID, retail price and the print file URL.
4. **Mockup → Create Task** with the same variant IDs and the design URL; with *Wait for Completion* on, the node returns the mockup image URLs.

### Using the node as an AI-agent tool

The node is marked `usableAsTool`. Add it to an AI Agent as a tool, pick a resource and operation, and let the agent fill the rest with `$fromAI()`.

## Printful Trigger

Starts a workflow when Printful sends an event. Events: order created / updated / failed / canceled / put on hold / hold approval / removed from hold / refunded, package shipped / returned, product synced / updated / deleted, stock updated.

A Printful store has **one webhook URL**. Activating the trigger points it at the workflow and replaces any webhook that was configured before (through the API or another workflow), so put every event you need into one trigger node per store. Deactivating removes the configuration only if it still points at this workflow. Printful does not sign webhook deliveries; the trigger drops events it did not subscribe to.

## Compatibility

Built and tested with n8n 2.43 (Node.js 20 and 24). Uses the Printful API v1 at `https://api.printful.com`.

## Resources

- [Printful API documentation](https://developers.printful.com/docs/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Version history

See [CHANGELOG.md](CHANGELOG.md).
