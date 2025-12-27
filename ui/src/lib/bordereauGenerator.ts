/**
 * Générateur de bordereau de transmission avec signature
 */

export interface BordereauData {
  numero: string;
  date: string;
  essaisRealises: string;
  demandePar: string;
  compteDe: string;
  dateEssais: string;
  lieuEssais: string;
  natureEssais: string;
  adresseRecepteur: string;
  observations: string;
  signature?: string;
}

export function generateBordereauHTML(data: BordereauData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bordereau de transmission – SNERTP</title>
<style>
body {
font-family: "Times New Roman", serif;
background: #fff;
color: #000;
margin: 0;
padding: 0;
}
.container {
width: 800px;
margin: auto;
border: 1px solid #000;
padding: 20px;
min-height: 1000px;
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
.signature-img {
max-width: 300px;
margin: 10px auto;
display: block;
}
.footer {
margin-top: 20px;
font-size: 12px;
text-align: left;
}
@media print {
  body { margin: 0; }
  .container { border: none; }
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
    N° : ${data.numero}<br>
    <br>
    Y. le ${data.date}
</div>

<div class="title">
    Bordereau de transmission
</div>

<table>
    <tr>
        <td class="label">ESSAIS RÉALISÉS SUR :</td>
        <td>${data.essaisRealises}</td>
    </tr>
    <tr>
        <td class="label">À la demande de :</td>
        <td>${data.demandePar}</td>
    </tr>
    <tr>
        <td class="label">Pour le compte de :</td>
        <td>${data.compteDe}</td>
    </tr>
    <tr>
        <td class="label">DATE ET LIEU DES ESSAIS :</td>
        <td>${data.dateEssais} au ${data.lieuEssais}</td>
    </tr>
    <tr>
        <td class="label">NATURE DES ESSAIS :</td>
        <td>${data.natureEssais}</td>
    </tr>
    <tr>
        <td class="label">ADRESSE DU RÉCEPTEUR DU RAPPORT DES ESSAIS :</td>
        <td>${data.adresseRecepteur}</td>
    </tr>
    <tr>
        <td class="label">OBSERVATIONS :</td>
        <td>${data.observations}</td>
    </tr>
</table>

<div class="signature">
    Le Directeur Général<br><br>
    ${data.signature ? `<img src="${data.signature}" alt="Signature" class="signature-img" /><br>` : ''}
    <strong>Kpadon C. MOUSSOUGAN</strong>
</div>

<div class="footer">
    Le présent rapport compte 1 page.
</div>

</div>

</body>
</html>`;
}

/**
 * Génère un bordereau avec les données d'un échantillon
 */
export function generateBordereauFromEchantillon(
  echantillon: any,
  signature: string
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).toUpperCase();

  const data: BordereauData = {
    numero: `${Math.floor(Math.random() * 10000)} / CNER-TP/DG`,
    date: dateStr,
    essaisRealises: echantillon.nature || 'Échantillon de sol',
    demandePar: echantillon.clientNom || echantillon.client_nom || 'Client',
    compteDe: echantillon.clientNom || echantillon.client_nom || 'Client',
    dateEssais: echantillon.date_reception ? 
      new Date(echantillon.date_reception).toLocaleDateString('fr-FR') : 
      now.toLocaleDateString('fr-FR'),
    lieuEssais: 'Laboratoire Essais Spéciaux',
    natureEssais: Array.isArray(echantillon.essais_types) ? 
      echantillon.essais_types.join(', ') : 
      'Essais géotechniques',
    adresseRecepteur: echantillon.clientNom || echantillon.client_nom || 'Client',
    observations: 'R.A.S.',
    signature
  };

  return generateBordereauHTML(data);
}

/**
 * Télécharge le bordereau en HTML
 */
export function downloadBordereauHTML(html: string, filename: string = 'bordereau.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ouvre le bordereau dans une nouvelle fenêtre pour impression/PDF
 */
export function printBordereau(html: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
