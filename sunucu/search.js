const fs = require('fs');
const path = require('path');

function aramaYap(dizin, query) {
  const dosyalar = fs.readdirSync(dizin);
  for (const dosya of dosyalar) {
    const tamYol = path.join(dizin, dosya);
    const istatistik = fs.statSync(tamYol);
    if (istatistik.isDirectory()) {
      aramaYap(tamYol, query);
    } else if (dosya.endsWith('.js') || dosya.endsWith('.jsx') || dosya.endsWith('.css')) {
      const icerik = fs.readFileSync(tamYol, 'utf8');
      if (icerik.includes(query)) {
        console.log(`Eşleşme bulundu: ${tamYol}`);
      }
    }
  }
}

console.log('Eşleşmeler aranıyor...');
aramaYap('c:/Users/Eren/Desktop/Pixboard/istemci/src', 'rastgeleKullaniciRengiAl');
aramaYap('c:/Users/Eren/Desktop/Pixboard/sunucu', 'rastgeleKullaniciRengiAl');
