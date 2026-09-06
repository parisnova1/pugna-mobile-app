import LegalPage, { LegalSection, LegalDivider } from '@/components/LegalPage'

// Placeholder body per the design spec — real legal copy to follow before
// launch. Structure/route matters now, not the final wording.
export default function DatenschutzScreen() {
  return (
    <LegalPage title="Datenschutz">
      <LegalSection label="Verantwortlicher">
        Pugna UG (haftungsbeschränkt), Musterstraße 1, 04103 Leipzig — siehe Impressum.
      </LegalSection>
      <LegalDivider />
      <LegalSection label="Erhobene Daten">
        Platzhalter — Kontodaten, Vereinszugehörigkeit, Nominierungen und Nutzungsdaten, soweit für den Betrieb der Kampfkarte notwendig.
      </LegalSection>
      <LegalDivider />
      <LegalSection label="Zweck der Verarbeitung">
        Platzhalter — Bereitstellung der Live-Karte, Nominierungen, Benachrichtigungen.
      </LegalSection>
      <LegalDivider />
      <LegalSection label="Deine Rechte">
        Platzhalter — Auskunft, Berichtigung, Löschung nach Art. 15–17 DSGVO.
      </LegalSection>
    </LegalPage>
  )
}
