const QRCode = require('qrcode');

async function generateSessionQR(sessionId, clientUrl) {
  const attendUrl = `${clientUrl}/attend/${sessionId}`;

  const imageBase64 = await QRCode.toDataURL(attendUrl, {
    type: 'image/png',
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1A1A1A', light: '#FFFFFF' },
  });

  return { attendUrl, imageBase64 };
}

module.exports = { generateSessionQR };
