import fs from 'fs';
import path from 'path';
import {BlobServiceClient} from '@azure/storage-blob';
import {CdnManagementClient} from "@azure/arm-cdn";
import {DefaultAzureCredential} from "@azure/identity";
import {exec} from 'child_process';
import {getContentType} from "../lib/utils";

/*
 * This function builds the Astro site, uploads it to Azure Storage and purges the CDN cache.
 */

export async function publish() {

	return new Promise((resolve, reject) => {

		let cwd = path.resolve(__dirname, '../../../astro');

		console.log(`Building Astro site in: ${cwd}`)

		exec('npm run build', {cwd}, async (error, stdout, stderr) => {

			if (error) return reject(error);

			// todo: evaluate for actual error messages; currently not fatal b/c of harmless warnings
			if (stderr) console.error(`Build stderr: ${stderr}`);
			if (stdout) console.log(`Build stdout: ${stdout}`);

			// Upload the contents of the dist folder to Azure Storage
			await uploadToAzureStorage(path.resolve(__dirname, '../../../astro/dist'));

			// Clear the CDN cache so that end users see the updated content
			// This is a non-blocking operation.  It may take a few minutes for the cache to clear.
			await purgeAzureCdnCache();

			// Yay!
			resolve(true);
		});
	})
}

/*
* The static storage site is fronted by Azure Front Door, which acts as a CND and caches content for faster delivery.
* When the site is updated, we need to clear the cache so that end users see the updated content.
*/

export async function uploadToAzureStorage(distFolder: string) {

	const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
	const CONTAINER_NAME = process.env.AZURE_WEB_CONTAINER_NAME || "$web"

	const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
	const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

	async function uploadDirectory(directory: string) {

		const files = fs.readdirSync(directory);

		for (const file of files) {

			const filePath = path.join(directory, file);
			const fileStat = fs.statSync(filePath);

			if (fileStat.isDirectory()) {

				await uploadDirectory(filePath);

			} else {

				const relativePath = path.relative(distFolder, filePath);
				const blockBlobClient = containerClient.getBlockBlobClient(relativePath);
				const blobContentType = getContentType(filePath) || 'text/html';

				await blockBlobClient.uploadFile(filePath, {blobHTTPHeaders: {blobContentType}});

				console.log(`Uploaded ${filePath} to Azure Storage as ${relativePath}`);
			}
		}
	}

	await uploadDirectory(distFolder);
}

export async function purgeAzureCdnCache(contentPaths: string[] = ['/*']) {

	const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID || '';
	const RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP || '';
	const PROFILE_NAME = process.env.AZURE_FRONT_DOOR_NAME || '';
	const ENDPOINT = process.env.AZURE_FRONT_DOOR_ENDPOINT || '';

	const credential = new DefaultAzureCredential();
	const cdnClient = new CdnManagementClient(credential, SUBSCRIPTION_ID);

	const purgeParameters = {contentPaths};

	await cdnClient.afdEndpoints.beginPurgeContent(
		RESOURCE_GROUP,
		PROFILE_NAME,
		ENDPOINT,
		purgeParameters
	);

	console.log(`Purged CDN cache for ${ENDPOINT}`);
}
