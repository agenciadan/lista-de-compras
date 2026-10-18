'use strict';
const ShoppingLists = {
  migrate(data) {
    const s = structuredClone(data);
    if (!Array.isArray(s.items) || !Array.isArray(s.history)) throw Error('Dados inválidos');
    if (!Array.isArray(s.lists) || s.lists.length === 0) {
      s.lists = [{id: crypto.randomUUID(), name: 'Minha primeira lista', budget: Number.isSafeInteger(s.budget) ? s.budget : 0}];
    }
    for (const list of s.lists) if (!list.id || !list.name || !Number.isSafeInteger(list.budget) || list.budget < 0) throw Error('Lista inválida');
    const ids = new Set(s.lists.map(l => l.id));
    if (!ids.has(s.activeListId)) s.activeListId = s.lists[0].id;
    for (const i of s.items) if (!ids.has(i.listId)) i.listId = s.lists[0].id;
    for (const h of s.history) if (!h.listId) h.listId = s.items.find(i => i.id === h.itemId)?.listId || s.lists[0].id;
    delete s.budget;
    s.schemaVersion = 2;
    return s;
  },
  active(s) {return s.lists.find(l => l.id === s.activeListId);},
  items(s) {return s.items.filter(i => i.listId === s.activeListId);},
  summary(s, quote) {
    const items = this.items(s), pending = items.filter(i => !i.done);
    const spent = items.filter(i => i.done).reduce((sum,i) => sum + Math.round(i.paidQty*i.paidPrice),0);
    const estimate = pending.reduce((sum,i) => sum + (quote(i) ? Math.round(i.qty*quote(i).price) : 0),0);
    return {spent, estimate, missing: pending.filter(i => !quote(i)).length, balance: this.active(s).budget-spent};
  }
};
if(typeof module !== 'undefined') module.exports=ShoppingLists;
