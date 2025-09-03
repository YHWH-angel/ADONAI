import { useAppStore } from '@/store'
import QRCode from 'react-qr-code'
import { useTranslation } from 'react-i18next'

export default function Receive() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)
  return (
    <div className="receive">
      <p>
        {t('address')}: {address}
      </p>
      <QRCode value={address} />
    </div>
  )
}
