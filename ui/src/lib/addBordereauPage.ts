import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';

export async function addBordereauPage(pdfUrl: string, signature: string): Promise<string> {
  console.log('=== DEBUT addBordereauPage ===');
  console.log('PDF URL:', pdfUrl);
  console.log('Signature:', signature ? 'Présente' : 'Absente');
  // VOTRE HTML EXACT
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bordereau de transmission – SNERTP</title>
<style>
body {
font-family: "Times New Roman", serif;
background: #fff;
color: #000;
}
.container {
width: 800px;
margin: auto;
border: 1px solid #000;
padding: 20px;
}
.header {
display: flex;
justify-content: space-between;
align-items: center;
}
.logo {
font-weight: bold;
font-size: 24px;
}
.org {
text-align: center;
font-size: 14px;
font-weight: bold;
}
.meta {
margin-top: 10px;
font-size: 12px;
}
.title {
text-align: center;
font-weight: bold;
margin: 20px 0;
text-transform: uppercase;
}
table {
width: 100%;
border-collapse: collapse;
font-size: 14px;
}
table, td {
border: 1px solid #000;
}
td {
padding: 8px;
vertical-align: top;
}
.label {
width: 30%;
font-weight: bold;
}
.signature {
margin-top: 40px;
text-align: center;
font-size: 14px;
}
.footer {
margin-top: 20px;
font-size: 12px;
text-align: left;
}
</style>
</head>
<body>

<div class="container">

<div class="header">
    <div class="logo">SNERTP</div>
    <div class="org">
        CENTRE NATIONAL D'ESSAIS ET DE<br>
        RECHERCHES DES TRAVAUX PUBLICS
    </div>
</div>

<div class="meta">
    N° : 4852 / CNER-TP/DG<br>
    <br>
    Y. le 21 DEC 2021
</div>

<div class="title">
    Bordereau de transmission
</div>

<table>
    <tr>
        <td class="label">ESSAIS RÉALISÉS SUR :</td>
        <td>
            Forage à béton Ø 16, Ø 12 et Ø 10 produits à l'usine de SIAB
            et employés sur le chantier du lycée d'Ifangni
        </td>
    </tr>
    <tr>
        <td class="label">À la demande de :</td>
        <td>SIAB</td>
    </tr>
    <tr>
        <td class="label">Pour le compte de :</td>
        <td>SIAB</td>
    </tr>
    <tr>
        <td class="label">DATE ET LIEU DES ESSAIS :</td>
        <td>25/10/2021 au Laboratoire Essais Spéciaux</td>
    </tr>
    <tr>
        <td class="label">NATURE DES ESSAIS :</td>
        <td>
            Mesure du diamètre, détermination de la masse linéique
            et essai de traction
        </td>
    </tr>
    <tr>
        <td class="label">ADRESSE DU RÉCEPTEUR DU RAPPORT DES ESSAIS :</td>
        <td>
            SIAB ; Tél : 20 24 60 50 / 20 24 62 52 / 94 46 70 70
        </td>
    </tr>
    <tr>
        <td class="label">OBSERVATIONS :</td>
        <td>R.A.S.</td>
    </tr>
</table>

<div class="signature">
    Le Directeur Général<br><br>
    <img src="${signature}" style="max-width: 300px; margin: 10px auto; display: block;" /><br>
    <strong>Kpadon C. MOUSSOUGAN</strong>
</div>

<div class="footer">
    Le présent rapport compte 1 page.
</div>

</div>

</body>
</html>`;

  // Créer div temporaire
  const div = document.createElement('div');
  div.innerHTML = html;
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.width = '210mm';
  document.body.appendChild(div);

  // Convertir en image
  const canvas = await html2canvas(div, { 
    scale: 2, 
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
    windowWidth: 794,
    windowHeight: 1123
  });
  document.body.removeChild(div);

  const imgData = canvas.toDataURL('image/png');

  // Charger PDF original
  console.log('Chargement du PDF original...');
  const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
  console.log('PDF chargé, taille:', pdfBytes.byteLength, 'bytes');
  const originalPdf = await PDFDocument.load(pdfBytes);
  const pageCount = originalPdf.getPageCount();
  console.log('PDF original a', pageCount, 'pages');

  // Créer nouveau PDF
  console.log('Création du nouveau PDF...');
  const newPdf = await PDFDocument.create();

  // Page 1: Bordereau
  console.log('Ajout de la page bordereau...');
  const page1 = newPdf.addPage([595.28, 841.89]);
  const img = await newPdf.embedPng(imgData);
  const imgDims = img.scale(0.75);
  page1.drawImage(img, { 
    x: (595.28 - imgDims.width) / 2, 
    y: (841.89 - imgDims.height) / 2, 
    width: imgDims.width, 
    height: imgDims.height 
  });
  console.log('Page bordereau ajoutée');

  // Pages suivantes: TOUTES les pages du PDF original
  console.log('Copie des', pageCount, 'pages du PDF original...');
  for (let i = 0; i < pageCount; i++) {
    const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
    newPdf.addPage(copiedPage);
    console.log('Page', i + 1, '/', pageCount, 'copiée');
  }
  
  console.log('Total pages dans le nouveau PDF:', newPdf.getPageCount());

  // Retourner URL
  console.log('Génération du blob final...');
  const bytes = await newPdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  console.log('=== FIN addBordereauPage ===');
  console.log('URL générée:', url);
  return url;
}
