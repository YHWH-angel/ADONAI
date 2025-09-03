import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWalletStore } from '@/store/wallet'
import { generateMnemonic, validateMnemonic } from '@scure/bip39'
import { english } from '@scure/bip39/wordlists/english'
import './onboarding.css'

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
    const mnemonic = generateMnemonic(english, 128)
    const words = mnemonic.split(' ')
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
    if (validateMnemonic(words.join(' '), english)) {
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
