import jsPDF from 'jspdf'

export function generateCertificate({name, courseTitle, date}){
  const doc = new jsPDF({orientation: 'landscape'})
  doc.setFontSize(22)
  doc.setTextColor('#0b3d91')
  doc.text('CECA-Solutions', 20, 30)
  doc.setFontSize(16)
  doc.setTextColor('#333')
  doc.text('Certificat de formation', 20, 50)
  doc.setFontSize(14)
  doc.text(`Attribué à : ${name}`, 20, 70)
  doc.text(`Formation : ${courseTitle}`, 20, 85)
  doc.text(`Date : ${date}`, 20, 100)
  doc.setFontSize(10)
  doc.text('Signature:', 20, 130)
  doc.text('CECA-Solutions — L\'expertise au service de la performance publique', 20, 140)
  return doc.output('blob')
}
