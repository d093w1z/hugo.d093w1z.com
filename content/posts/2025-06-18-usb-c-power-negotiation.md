---
author: d093w1z
title: USB-C Power Negotiation
date: 2025-06-18T18:11:15.000Z
lastmod: 2025-06-18T18:11:15.000Z
description: null
tags:
  - usb-c
  - usb
  - power
categories:
  - hardware
  - technology
  - device
slug: usb-c-power-negotiation
draft: false
toc: true
---
# USB-C Power Negotiation

---

## 1.  Power Role Determination (CC Line)

USB‑C uses two Configuration Channel (CC) pins to negotiate roles:

- **Pull‑up (Rp)** → indicates a power **Source** (provides VBUS)
- **Pull‑down (Rd)** → indicates a power **Sink** (consumes VBUS)
- Resistor magnitude on Rp/Rd also signals default current capability (up to 3 A) 

Dual‑Role devices (DRP) randomly pick Rp or Rd during attach, then can swap roles dynamically

---

## 2.  Establishing Standard Power (≤15 W)

- Initial VBUS is set to 5 V after role detection.
- Passive current advertisement (via CC resistor) allows up to 1.5 A or 3.0 A at 5 V (7.5–15 W)

---

## 3.  USB Power Delivery (PD) Negotiation

To exceed 15 W (i.e., up to 100 W), the **PD protocol** kicks in over CC:

1. **Source → Sink:** _Source_Capabilities_ (list of PDOs: voltages, currents)
2. **Sink → Source:** _Request_ (selects one PDO, specifying current)
3. **Source → Sink:** _Accept_, then adjusts VBUS
4. **Source → Sink:** _PS_RDY_ once voltage stabilizes  
5. Each message is followed by GoodCRC.

Negotiated ranges: 5–20 V up to 5 A (100 W). Newer Extended Power Range (EPR) supports up to 48 V/240 W.

---

## 4.  Data Role & Alternate Mode Negotiation

USB‑C also supports data role switching and Alternate Modes:

- **Data roles**: DFP = host; UFP = device; DRD = dual‑role
- Data role is auto-assigned via CC similar to power roles.
- **Alternate Modes** (e.g., DisplayPort, Thunderbolt): negotiated via vendor-specific messages over CC after PD setup.

Wide reuse of CC for power, data, and orientation detection.

---

## 5.  Why Crossing USB‑C Is (Usually) Safe

- **Standardized roles & limits**: Devices won't exceed safe default scenarios.
- **PD negotiation** ensures voltage/current are mutually agreed before ramping VBUS.
- **Safe to plug mismatched USB‑C**: If the other end can't supply/accept power, VBUS stays off or remains at safe 0 V/5 V.
- **Data security**: “Juice jacking” (malicious/data-stealing via public USB ports) is a remote theoretic risk – mitigated by modern OS prompts or using charge-only cables/adapters.

---

## 6.  Why It Can Be Unsafe

1. **Poor-quality cables**:
   - Non-compliant resistor values (e.g., 10 kΩ instead of 56 kΩ)
   - Fake e‑marker chips can misreport capabilities → device damage.
   - Overvoltage incidents where VBUS pin contacts CC, damaging devices.

2. **Counterfeit chargers**:
   - Can overheat, catch fire (NY Post reported generic charger burning blanket).
   - Cyber‑hacked chargers can install malware (“juice‑jacking”).

3. **Alternate Mode failures**:
   - If Alternate Mode (e.g. DP) fails, device may display billboard or fall back to USB‑2.0 data only.

---

## ✅ Key Takeaways

- **Power negotiation**: CC lines define roles; PD protocol negotiates higher voltage/current.
- **Data negotiation**: Roles and Alternate Modes negotiated via CC/PD after power roles.
- **Safety**: Generally safe when using compliant cables/devices—negotiation prevents unsafe power delivery.
- **Risks**: Cheap/counterfeit cables or chargers bypass specs, risking overheating, damaging devices, or data theft.
- **Best practices**:
  - Use certified **USB‑C PD** cables with proper e‑markers.
  - Buy reputable chargers.
  - Avoid public “free” USB ports or use data‑blockers.
  - Watch for OS prompts before enabling data transfers.

---
