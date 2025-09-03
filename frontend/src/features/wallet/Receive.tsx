import { useAppStore } from '@/store'
import QRCode from 'react-qr-code'
import { useTranslation } from 'react-i18next'
import { useWallet } from '@/hooks/useWallet'

export default function Receive() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)
  const { newAddress } = useWallet()
  return (
    <div className="receive">
      <p>
        {t('address')}: {address}
      </p>
      <QRCode value={address} />
      <button onClick={newAddress}>{t('newAddress')}</button>
    </div>
  )
}
