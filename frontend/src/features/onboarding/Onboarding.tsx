import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWalletStore } from '@/store/wallet'
import './onboarding.css'

const WORDS = [
  'apple',
  'banana',
  'cherry',
  'dog',
  'eagle',
  'frog',
  'grape',
  'house',
  'ice',
  'jungle',
  'kite',
  'lemon',
  'moon',
  'night',
  'orange',
  'pumpkin',
  'queen',
  'rocket',
  'sun',
  'tree',
  'umbrella',
  'violin',
  'whale',
  'xray',
  'yellow',
  'zebra',
]

function generateSeed() {
  return Array.from(
    { length: 12 },
    () => WORDS[Math.floor(Math.random() * WORDS.length)],
  )
}

enum Step {
  CHOOSE,
  SHOW,
  VERIFY,
  IMPORT,
}

export default function Onboarding() {
  const { t } = useTranslation()
  const loadWallet = useWalletStore((s) => s.loadWallet)

  const [step, setStep] = useState<Step>(Step.CHOOSE)
  const [seed, setSeed] = useState<string[]>([])
  const [input, setInput] = useState('')

  const handleCreate = () => {
    const words = generateSeed()
    setSeed(words)
    setStep(Step.SHOW)
  }

  const handleVerify = () => {
    const words = input.trim().split(/\s+/)
    if (words.join(' ') === seed.join(' ')) {
      loadWallet(seed)
    } else {
      alert(t('seedMismatch'))
    }
  }

  const handleImport = () => {
    const words = input.trim().split(/\s+/)
    if (words.length >= 12) {
      loadWallet(words)
    } else {
      alert(t('seedInvalid'))
    }
  }

  return (
    <div className="onboarding">
      {step === Step.CHOOSE && (
        <div>
          <h2>{t('onboardingTitle')}</h2>
          <button onClick={handleCreate}>{t('createWallet')}</button>
          <button onClick={() => setStep(Step.IMPORT)}>
            {t('loadWallet')}
          </button>
        </div>
      )}

      {step === Step.SHOW && (
        <div>
          <h2>{t('seedTitle')}</h2>
          <p className="seed" aria-label={t('seedLabel')}>
            {seed.join(' ')}
          </p>
          <button onClick={() => setStep(Step.VERIFY)}>
            {t('confirmSeed')}
          </button>
        </div>
      )}

      {step === Step.VERIFY && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleVerify()
          }}
        >
          <h2>{t('verifySeed')}</h2>
          <label htmlFor="verify">{t('seedLabel')}</label>
          <textarea
            id="verify"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />
          <button type="submit">{t('submit')}</button>
        </form>
      )}

      {step === Step.IMPORT && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleImport()
          }}
        >
          <h2>{t('loadWallet')}</h2>
          <label htmlFor="seed">{t('seedLabel')}</label>
          <textarea
            id="seed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />
          <button type="submit">{t('submit')}</button>
        </form>
      )}
    </div>
  )
}
