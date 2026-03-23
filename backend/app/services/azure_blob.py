import os
from datetime import datetime, timedelta
from azure.storage.blob import (
    BlobServiceClient,
    generate_blob_sas,
    BlobSasPermissions
)
from dotenv import load_dotenv

load_dotenv()

AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING")
CONTAINER_NAME = "generations"

blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_CONNECTION_STRING
)


def upload_file_to_blob(file_bytes: bytes, blob_name: str):
    blob_client = blob_service_client.get_blob_client(
        container=CONTAINER_NAME,
        blob=blob_name
    )

    blob_client.upload_blob(file_bytes, overwrite=True)

    return blob_name


def generate_sas_url(blob_name: str, expiry_minutes: int = 60):
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=CONTAINER_NAME,
        blob_name=blob_name,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(minutes=expiry_minutes)
    )

    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{blob_name}?{sas_token}"


def delete_blob(blob_name: str):
    try:
        blob_client = blob_service_client.get_blob_client(
            container=CONTAINER_NAME,
            blob=blob_name
        )
        blob_client.delete_blob()
    except Exception as e:
        print(f"Blob delete failed for {blob_name}: {e}")