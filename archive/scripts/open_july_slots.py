#!/usr/bin/env python3
# Ouvre les créneaux d'inscription des lundis de juillet (6,13,20,27),
# retire le sondage juillet de la vue inscriptions, ajoute un encart Summer break.
import io
h = io.open("index.html", encoding="utf-8").read()

# 1) Ajouter les 4 créneaux de juillet après ins_jun_29
OLD_SLOT = "  { id:'ins_jun_29', label:'Lundi 29 juin 2026',  open:true, benchPriority:['Spy'] },\n"
NEW_SLOT = OLD_SLOT + (
    "  { id:'ins_jul_06', label:'Lundi 6 juillet 2026',  open:true },\n"
    "  { id:'ins_jul_13', label:'Lundi 13 juillet 2026', open:true },\n"
    "  { id:'ins_jul_20', label:'Lundi 20 juillet 2026', open:true },\n"
    "  { id:'ins_jul_27', label:'Lundi 27 juillet 2026 · Fin de saison 🏁', open:true },\n"
)
assert h.count(OLD_SLOT) == 1, "slot ins_jun_29: %d" % h.count(OLD_SLOT)
h = h.replace(OLD_SLOT, NEW_SLOT)

# 2) Sous-titre Inscriptions
OLD_SUB = "  html+='<div class=\"ins-subtitle\">Juin 2026 · Lundis soir · Urban Five</div>';"
NEW_SUB = "  html+='<div class=\"ins-subtitle\">Juin–Juillet 2026 · Lundis soir · Urban Five</div>';"
assert h.count(OLD_SUB) == 1, "sous-titre: %d" % h.count(OLD_SUB)
h = h.replace(OLD_SUB, NEW_SUB)

# 3) Remplacer le sondage par l'encart Summer break (et retirer loadSondageJuillet)
OLD_SOND = (
    "  html+=_renderSondageHTML(knownPlayers);\n"
    "  wrap.innerHTML=html;\n\n"
    "  loadSondageJuillet();\n"
)
BANNER = (
    "  html+='<div style=\"text-align:center;background:linear-gradient(135deg,rgba(255,214,0,.09),rgba(255,140,0,.06));"
    "border:1px solid rgba(255,214,0,.22);border-radius:14px;padding:1.1rem 1.1rem;margin-top:1.1rem\">'\n"
    "    +'<div style=\"font-size:1.7rem;line-height:1\">☀️🏖️</div>'\n"
    "    +'<div style=\"font-family:Oswald,sans-serif;font-size:1rem;font-weight:700;color:#FFD600;text-transform:uppercase;letter-spacing:.1em;margin-top:.45rem\">Summer break</div>'\n"
    "    +'<div style=\"font-family:Barlow,sans-serif;font-size:.72rem;color:rgba(255,255,255,.55);line-height:1.55;margin-top:.45rem\">Dernier five de la saison le <strong style=\"color:rgba(255,255,255,.8)\">lundi 27 juillet</strong>. Pause estivale en août — on remet les crampons à la rentrée. Bon été à tous ! ⚽</div>'\n"
    "    +'</div>';\n"
)
NEW_SOND = BANNER + "  wrap.innerHTML=html;\n"
assert h.count(OLD_SOND) == 1, "bloc sondage: %d" % h.count(OLD_SOND)
h = h.replace(OLD_SOND, NEW_SOND)

io.open("index.html", "w", encoding="utf-8").write(h)
print("OK — créneaux juillet ouverts, sondage retiré, Summer break ajouté")
