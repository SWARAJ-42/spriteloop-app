import firebase_admin
from firebase_admin import auth, credentials

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred)


def verify_firebase_token(token: str):
    """
    Verifies Firebase ID token sent from frontend.
    """
    decoded = auth.verify_id_token(token)
    return decoded


def delete_firebase_user(uid: str):
    try:
        auth.delete_user(uid)
    except Exception as e:
        print(f"Firebase delete failed: {e}")
        raise

