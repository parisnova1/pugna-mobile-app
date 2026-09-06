import LegalPage, { LegalSection, LegalDivider } from '@/components/LegalPage'

// Top-level route (not under (tabs)/(onboarding)) so it's reachable with no
// account and no onboarding gate — see root _layout.tsx's comment on why
// every file under src/app is globally reachable regardless of group.
export default function ImpressumScreen() {
  return (
    <LegalPage title="Impressum">
      <LegalSection label="Anbieter">
        {'Pugna UG (haftungsbeschränkt)\nMusterstraße 1\n04103 Leipzig\nDeutschland'}
      </LegalSection>
      <LegalDivider />
      <LegalSection label="Vertreten durch">Platzhalter Name</LegalSection>
      <LegalDivider />
      <LegalSection label="Kontakt">{'kontakt@pugna.app\n+49 000 0000000'}</LegalSection>
      <LegalDivider />
      <LegalSection label="Register">{'Amtsgericht Platzhalter · HRB 00000\nUSt-IdNr. DE000000000'}</LegalSection>
      <LegalDivider />
      <LegalSection label="Verantwortlich für Inhalte">Platzhalter Name, Adresse wie oben</LegalSection>
    </LegalPage>
  )
}
