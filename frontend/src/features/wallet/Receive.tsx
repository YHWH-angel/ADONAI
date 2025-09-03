import { useEffect } from 'react'
import { useAppStore } from '@/store'
import QRCode from 'react-qr-code'
import { useTranslation } from 'react-i18next'

export default function Receive() {
  const { t } = useTranslation()
  const { address, setAddress } = useAppStore((s) => ({
    address: s.address,
    setAddress: s.setAddress,
  }))

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/getnewaddress', { method: 'POST' })
        const data = await res.json()
        if (data.result) setAddress(data.result)
      } catch (err) {
        console.error('getnewaddress failed', err)
      }
    })()
  }, [setAddress])

  return (
    <div className="receive">
      <p>
        {t('address')}: {address}
      </p>
      <QRCode value={address} />
    </div>
  )
}
