export const named = value => Boolean(value && String(value).trim() && String(value).trim().toLowerCase() !== 'no');
export const statusConflict = p => Boolean(p.APPL_STATUS && p.Application_Status__c && p.APPL_STATUS !== p.Application_Status__c);
export function filterRecords(rows, filters) {
  const q = (filters.search || '').trim().toLowerCase();
  return rows.filter(({properties:p}) =>
    (!filters.municipality || p.MUN_NAME === filters.municipality) &&
    (!filters.type || p.APPL_TYPE === filters.type) &&
    (!filters.status || p.APPL_STATUS === filters.status) &&
    (!filters.evidence || named(p.WSERVAREA) === (filters.evidence === 'named')) &&
    (!q || [p.ADDRESS,p.APPL_NAME,p.REG_FILE_NUM,p.APPL_DESC].some(x => String(x || '').toLowerCase().includes(q))));
}
export function csv(rows) {
  const fields = ['OBJECTID','REG_FILE_NUM','MUN_NAME','ADDRESS','APPL_TYPE','APPL_STATUS','Application_Status__c','WSERVAREA','WWSERVAREA'];
  const quote = v => '"'+String(v ?? '').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  return [fields.join(','), ...rows.map(r => fields.map(f => quote(r.properties[f])).join(','))].join('\r\n');
}
