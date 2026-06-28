# FleetScan Técnica — landing page

Landing estática para servicio de escaneo vehicular y diagnóstico electrónico orientado a camiones, buses, utilitarios y flotas comerciales.

## Research brief

Fuentes revisadas para estrategia y diseño:

- UVeye heavy-duty fleets: posicionamiento “MRI for vehicles”, inspección 360°, reportes digitales, foco en camiones/buses Class 6–8.
- Noregon JPRO / Cummins INSITE: diagnóstico profesional para vehículos pesados, módulos, códigos de falla, datos electrónicos.
- Geotab / Fleetio / Coast: mantenimiento preventivo, historial, órdenes de trabajo, telemática y reducción de paradas.
- Heavy Duty Journal / SEO diesel repair: captación local por búsquedas de alta intención, prueba social técnica y CTA directo.
- Competidores locales argentinos: servicios de diagnóstico computarizado para camiones, buses, marcas pesadas y flotas.

## Design direction

- Visual: técnico premium, dark navy + paper + amber scan beam. Sin glassmorphism ni efectos gimmick.
- Conversión: hero con dolor operativo, CTA directo, servicios, matriz de flota, proceso de 4 pasos, SEO local y formulario.
- SEO: title/description/keywords, canonical, OG/Twitter, robots, sitemap, JSON-LD LocalBusiness/AutoRepair + FAQPage.
- Ponytail: cero framework y cero dependencias; HTML/CSS/JS estático porque la landing no necesita app runtime.

## Local

```bash
npm run check
python3 -m http.server 4173
```
