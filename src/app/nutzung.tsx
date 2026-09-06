import LegalPage, { LegalSection, LegalDivider } from '@/components/LegalPage'

// Placeholder body per the design spec — real legal copy to follow before
// launch. Structure/route matters now, not the final wording.
export default function NutzungScreen() {
  return (
    <LegalPage title="Nutzungsbedingungen">
      <LegalSection label="Geltungsbereich">
        Platzhalter — diese Bedingungen gelten für die Nutzung von Pugna durch Zuschauer:innen, Kämpfer:innen, Vereine und Veranstalter.
      </LegalSection>
      <LegalDivider />
      <LegalSection label="Konto & Rollen">
        Platzhalter — ein Konto kann jederzeit eine Rolle (Zuschauen, Kämpfer:in, Verein, Veranstalter) tragen; Änderungen sind in den Einstellungen möglich.
      </LegalSection>
      <LegalDivider />
      <LegalSection label="Inhalte">
        Platzhalter — Namen, Vereine und Ergebnisse werden von Vereinen und Veranstaltern gepflegt und können jederzeit korrigiert werden.
      </LegalSection>
    </LegalPage>
  )
}
