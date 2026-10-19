# sbkim/

Hier liegt die **öffentliche** Visitenkarte des Knotens: `spore.json`.

Sie wird **im Browser** erzeugt (Siegel-Modal → 🔑 Eigene Identität & Spore →
Spore signieren + herunterladen) und dann hierher committet. Sie enthält nur
öffentliche Daten (nodeId, öffentlicher Schlüssel, Domänen-Vektor, Signatur) —
**niemals** den privaten Schlüssel oder ein Backup (siehe `.gitignore`).

- **nodeId:** `6rmW2Q-53mzEylZiWuW4yNsbnxlyEoLD11860i3y0Cg`
- **Domäne:** Privates Daten-Gehirn (`nodeName: Private Brain`)
- **protocolVersion:** `0.2` (Spore v0.2 — echter 384-dim `domainVector` + Satz-Schnipsel)
- **Erzeugt:** 2026-07-20 (Klaus' Browser), kryptografisch reziprok verifiziert (✔ VALID).
