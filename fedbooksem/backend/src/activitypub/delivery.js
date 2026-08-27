const axios = require('axios');
const forge = require('node-forge');
const crypto = require('crypto');

async function deliverActivity(activity, actor, inboxUrls, privateKeyPem) {
  const body = JSON.stringify(activity);
  const digest = 'SHA-256=' + crypto.createHash('sha256').update(body).digest('base64');
  const date = new Date().toUTCString();

  for (const inboxUrl of inboxUrls) {
    try {
      const url = new URL(inboxUrl);
      const signingString = `(request-target): post ${url.pathname}\nhost: ${url.host}\ndate: ${date}\ndigest: ${digest}`;

      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const md = forge.md.sha256.create();
      md.update(signingString, 'utf8');
      const signature = forge.util.encode64(privateKey.sign(md));

      const keyId = `${actor.id}#main-key`;
      const signatureHeader = `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`;

      await axios.post(inboxUrl, body, {
        headers: {
          'Content-Type': 'application/activity+json',
          'Date': date,
          'Host': url.host,
          'Digest': digest,
          'Signature': signatureHeader,
        },
        timeout: 5000,
      });
    } catch (err) {
      console.error(`Delivery failed to ${inboxUrl}:`, err.message);
    }
  }
}

module.exports = { deliverActivity };
