import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const account = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

let blobServiceClient: BlobServiceClient | null = null;

if (account && accountKey && containerName) {
  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey,
  );
  blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential,
  );
}

export const getContainerClient = () => {
  if (!blobServiceClient) {
    throw new Error(
      "Azure Storage configuration is missing. Please set AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, and AZURE_STORAGE_CONTAINER_NAME environment variables.",
    );
  }
  return blobServiceClient.getContainerClient(containerName);
};
