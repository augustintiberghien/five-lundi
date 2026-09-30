#!/usr/bin/env python3
"""Fix doRegister : fetch matchRegs après inscription au five."""

with open('index.html', 'r') as f:
    c = f.read()

OLD = "  sbRegister(slotId, name).then(function(){ return sbGetRegistrations(slotId); }).then(function(regs){ _updateSlotUI(slot,regs,name); }).catch(function(e){ console.error(e); if(input) input.disabled=false; if(btn) btn.disabled=false; });"
NEW = "  var matchPromise=slot&&slot.matchEvent?sbGetRegistrations(slot.matchEvent.id):Promise.resolve([]);\n  sbRegister(slotId, name).then(function(){ return Promise.all([sbGetRegistrations(slotId),matchPromise]); }).then(function(results){ _updateSlotUI(slot,results[0],name,results[1]); }).catch(function(e){ console.error(e); if(input) input.disabled=false; if(btn) btn.disabled=false; });"

if OLD in c:
    c = c.replace(OLD, NEW, 1)
    print("✅ doRegister : matchRegs fetchés après inscription five")
else:
    print("❌ Ancre non trouvée")

with open('index.html', 'w') as f:
    f.write(c)
