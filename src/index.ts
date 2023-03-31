import { getInput, info, setFailed, setOutput } from '@actions/core';
import { get } from 'node:https';
import { PeerCertificate, TLSSocket } from 'node:tls';

const getCertificate = async (url: URL) => new Promise<PeerCertificate>((resolve, reject) => {
  get(url, { agent: false }, response => resolve((response.socket as TLSSocket).getPeerCertificate(false)))
    .on('error', err => reject(err));
});

const main = async (): Promise<void> => {
  const maxCertExpireDaysLeft = parseInt(getInput('max-cert-expire-days-left'));
  const url = new URL(getInput('url', { required: true }));

  const { valid_to: certExpireDate } = await getCertificate(url);

  const certExpireDaysLeft = Math.floor((Date.parse(certExpireDate) - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const certExpireMessage = `Certificate for ${url.host} is valid until "${certExpireDate}" hence it will expire in ${certExpireDaysLeft} days`;

  info(certExpireMessage);
  setOutput('cert-expire-date', certExpireDate);
  setOutput('cert-expire-days-left', certExpireDaysLeft);

  if (certExpireDaysLeft <= maxCertExpireDaysLeft) {
    setFailed(certExpireMessage);
  }
}


main().catch(error => {
  setFailed('unhandled error ' + JSON.stringify(error));
});
