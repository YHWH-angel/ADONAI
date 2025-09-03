import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWalletStore } from '@/store/wallet'
import { useAppStore } from '@/store'
import * as bip39 from 'bip39'
import './onboarding.css'

function generateSeed() {
  return bip39.generateMnemonic().split(' ')
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
  const csrfToken = useAppStore((s) => s.csrfToken)

  const [step, setStep] = useState<Step>(Step.CHOOSE)
  const [seed, setSeed] = useState<string[]>([])
  const [input, setInput] = useState('')

  const handleCreate = () => {
    const words = generateSeed()
    setSeed(words)
    setStep(Step.SHOW)
  }

  const initWallet = async (mnemonic: string[]) => {
    await fetch('/wallets/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ mnemonic: mnemonic.join(' ') }),
    })
  }

  const handleVerify = async () => {
    const words = input.trim().split(/\s+/)
    if (
      words.join(' ') === seed.join(' ') &&
      bip39.validateMnemonic(words.join(' '))
    ) {
      await initWallet(words)
      loadWallet(words)
    } else {
      alert(t('seedMismatch'))
    }
  }

  const handleImport = async () => {
    const words = input.trim().split(/\s+/)
    if (bip39.validateMnemonic(words.join(' '))) {
      await initWallet(words)
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
