"""Standard age/X25519 format via pyrage; secrets travel only through pipes."""
import json
import sys
import pyrage

try:
    request = json.load(sys.stdin)
    operation = request["operation"]
    if operation == "recipient":
        identity = pyrage.x25519.Identity.from_str(request["identity"])
        sys.stdout.write(str(identity.to_public()))
    elif operation == "encrypt":
        recipient = pyrage.x25519.Recipient.from_str(request["recipient"])
        sys.stdout.buffer.write(pyrage.encrypt(request["payload"].encode(), [recipient]))
    elif operation == "decrypt":
        import base64
        identity = pyrage.x25519.Identity.from_str(request["identity"])
        ciphertext = base64.b64decode(request["ciphertext"], validate=True)
        sys.stdout.buffer.write(pyrage.decrypt(ciphertext, [identity]))
    else:
        raise ValueError()
except Exception:
    # Never echo library errors or input (may contain the private identity).
    sys.stderr.write("age-Verarbeitung fehlgeschlagen; keine geheimen Daten ausgegeben.\n")
    sys.exit(1)
