import { type Collection, type CollectionItem, getItemPrice, PRICING_DB } from '../data';

export function collectionToCSV(collection: Collection): string {
  const headers = ['Title', 'Publisher', 'Year', 'Condition', 'Value', 'Notes', 'Source', 'Added'];
  const rows = collection.items.map(item => {
    const db = PRICING_DB.find(d => d.db_id === item.matchId);
    return [
      db?.title ?? item.customData?.title ?? 'Unknown',
      db?.publisher ?? item.customData?.publisher ?? '',
      String(db?.year ?? item.customData?.year ?? ''),
      item.condition,
      String(getItemPrice(item)),
      `"${(item.userNotes || '').replace(/"/g, '""')}"`,
      item.source,
      item.createdAt,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function generateInsuranceReport(collection: Collection): string {
  let report = `INSURANCE VALUATION REPORT\n`;
  report += `Collection: ${collection.name}\n`;
  report += `Category: ${collection.collectibleType}\n`;
  report += `Date: ${new Date().toLocaleDateString()}\n`;
  report += `Items: ${collection.items.length}\n\n`;

  let total = 0;
  collection.items.forEach((item, i) => {
    const db = PRICING_DB.find(d => d.db_id === item.matchId);
    const val = getItemPrice(item);
    total += val;
    report += `${i + 1}. ${db?.title ?? item.customData?.title ?? 'Unknown'}\n`;
    report += `   Condition: ${item.condition} | Value: $${val.toLocaleString()}\n`;
    if (item.userNotes) report += `   Notes: ${item.userNotes}\n`;
    report += '\n';
  });

  report += `TOTAL ESTIMATED VALUE: $${total.toLocaleString()}\n`;
  return report;
}
