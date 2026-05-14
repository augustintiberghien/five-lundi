#!/usr/bin/env python3
"""Affiche les mois avec tous slots fermés comme teaser grisé non cliquable."""

with open('index.html', 'r') as f:
    content = f.read()

# ── 1. _loadInscriptionSessions : charger TOUS les slots, marquer locked si closed ──
OLD1 = "  _INS_SESSIONS=[];\n  var promises=INSCRIPTION_SLOTS.filter(function(slot){return slot.open;}).map(function(slot){"
NEW1 = "  _INS_SESSIONS=[];\n  var promises=INSCRIPTION_SLOTS.map(function(slot){"

if OLD1 in content:
    content = content.replace(OLD1, NEW1, 1)
    print("✅ Filtre retiré — tous les slots chargés")
else:
    print("❌ Ancre 1 non trouvée")

# ── 2. Marquer le slot locked quand open:false ──
OLD2 = """        fromInscription:true,
        regCount:regs.length,"""
NEW2 = """        fromInscription:true,
        locked:!slot.open,
        regCount:regs.length,"""

if OLD2 in content:
    content = content.replace(OLD2, NEW2, 1)
    print("✅ Propriété locked ajoutée")
else:
    print("❌ Ancre 2 non trouvée")

# ── 3. buildTabs : détecter les mois "teaser" et les afficher grisés non cliquables ──
OLD3 = """    var grp=groups[key];
    var isActive=(key===_ak);
    /* Bouton mois */
    var mb=document.createElement('button');
    mb.className='tab tab-month'+(isActive?' expanded':'');
    mb.dataset.monthKey=key;
    mb.dataset.id='month-'+key;
    mb.textContent=grp.label+(isActive?' ▾':' ▸');
    mb.onclick=function(){"""
NEW3 = """    var grp=groups[key];
    var isActive=(key===_ak);
    /* Mois "teaser" : toutes les sessions sont des slots fermés */
    var isTeaser=grp.sessions.length>0&&grp.sessions.every(function(s){return s.fromInscription&&s.locked;});
    if(isTeaser){
      var tb=document.createElement('button');
      tb.className='tab tab-month';
      tb.dataset.id='month-'+key;
      tb.textContent=grp.label+' 🔒';
      tb.disabled=true;
      tb.style.opacity='.35';
      tb.style.cursor='default';
      wrap.appendChild(tb);
      return;
    }
    /* Bouton mois normal */
    var mb=document.createElement('button');
    mb.className='tab tab-month'+(isActive?' expanded':'');
    mb.dataset.monthKey=key;
    mb.dataset.id='month-'+key;
    mb.textContent=grp.label+(isActive?' ▾':' ▸');
    mb.onclick=function(){"""

if OLD3 in content:
    content = content.replace(OLD3, NEW3, 1)
    print("✅ Mois teaser grisé ajouté dans buildTabs")
else:
    print("❌ Ancre 3 non trouvée")

with open('index.html', 'w') as f:
    f.write(content)

print("\nDone.")
