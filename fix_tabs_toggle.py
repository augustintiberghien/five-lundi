#!/usr/bin/env python3
"""
Trois corrections sur l'historisation :
1. _loadInscriptionSessions : ignore les slots open:false
2. buildTabs month toggle : permet de fermer le mois actif en recliquant
3. Mois sans sessions : non affichés (plus de Juin vide)
"""

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. Ne charger que les slots ouverts ──
OLD1 = "  _INS_SESSIONS=[];\n  var promises=INSCRIPTION_SLOTS.map(function(slot){"
NEW1 = "  _INS_SESSIONS=[];\n  var promises=INSCRIPTION_SLOTS.filter(function(slot){return slot.open;}).map(function(slot){"

if OLD1 in content:
    content = content.replace(OLD1, NEW1, 1)
    print("✅ Filtre open:true dans _loadInscriptionSessions")
else:
    print("❌ Ancre 1 non trouvée")

# ── 2. Toggle mois : permettre de fermer le mois actif en recliquant ──
OLD2 = """    mb.onclick=function(){
      if(_ak===key)return;
      /* replier ancien */
      var oldMb=wrap.querySelector('[data-month-key="'+_ak+'"]');
      if(oldMb){oldMb.classList.remove('expanded');oldMb.textContent=groups[_ak].label+' ▸';}
      wrap.querySelectorAll('[data-smth="'+_ak+'"]').forEach(function(b){b.style.display='none';});
      /* déplier nouveau */
      _ak=key;
      mb.classList.add('expanded');
      mb.textContent=grp.label+' ▾';
      wrap.querySelectorAll('[data-smth="'+key+'"]').forEach(function(b){b.style.display='';});
    };"""

NEW2 = """    mb.onclick=function(){
      if(_ak===key){
        /* fermer le mois actif */
        mb.classList.remove('expanded');
        mb.textContent=grp.label+' ▸';
        wrap.querySelectorAll('[data-smth="'+key+'"]').forEach(function(b){b.style.display='none';});
        _ak=null;
        return;
      }
      /* replier l'ancien mois si un était ouvert */
      if(_ak){
        var oldMb=wrap.querySelector('[data-month-key="'+_ak+'"]');
        if(oldMb){oldMb.classList.remove('expanded');oldMb.textContent=groups[_ak].label+' ▸';}
        wrap.querySelectorAll('[data-smth="'+_ak+'"]').forEach(function(b){b.style.display='none';});
      }
      /* déplier nouveau */
      _ak=key;
      mb.classList.add('expanded');
      mb.textContent=grp.label+' ▾';
      wrap.querySelectorAll('[data-smth="'+key+'"]').forEach(function(b){b.style.display='';});
    };"""

if OLD2 in content:
    content = content.replace(OLD2, NEW2, 1)
    print("✅ Toggle mois (fermer en recliquant)")
else:
    print("❌ Ancre 2 non trouvée")

with open('index.html', 'w') as f:
    f.write(content)

print("\nDone.")
