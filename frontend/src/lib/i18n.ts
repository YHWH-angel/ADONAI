import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      onboardingTitle: 'Onboarding',
      createWallet: 'Create Wallet',
      loadWallet: 'Load Wallet',
      seedTitle: 'Your Seed',
      seedLabel: 'Seed',
      confirmSeed: "I've written it down",
      verifySeed: 'Verify Seed',
      submit: 'Submit',
      seedMismatch: 'Seed does not match',
      seedInvalid: 'Seed is invalid',
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido',
      onboardingTitle: 'Inicio',
      createWallet: 'Crear Billetera',
      loadWallet: 'Cargar Billetera',
      seedTitle: 'Tu Semilla',
      seedLabel: 'Semilla',
      confirmSeed: 'Ya la anoté',
      verifySeed: 'Verificar Semilla',
      submit: 'Enviar',
      seedMismatch: 'La semilla no coincide',
      seedInvalid: 'Semilla inválida',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
