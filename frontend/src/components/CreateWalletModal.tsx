import { useState } from 'react'
import Modal from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: () => void
}

export default function CreateWalletModal({ open, onClose, onCreate }: Props) {
  const [walletName, setWalletName] = useState('Wallet')
  const [encrypt, setEncrypt] = useState(false)
  const [disableKeys, setDisableKeys] = useState(false)
  const [blank, setBlank] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-80 bg-slate-100 text-slate-900 border border-slate-400 shadow-md">
        <div className="flex items-center justify-between bg-slate-200 border-b border-slate-400 px-3 py-1">
          <h2 className="text-sm font-semibold">Create Wallet</h2>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="text-lg leading-none hover:text-slate-700"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 text-sm space-y-3">
          <p className="text-xs">
            You are one step away from creating your new wallet! Please provide
            a name and, if desired, enable any advanced options
          </p>
          <label className="block">
            <span className="block mb-1">Wallet Name</span>
            <input
              className="w-full border border-slate-400 bg-white px-2 py-1"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={encrypt}
              onChange={(e) => setEncrypt(e.target.checked)}
            />
            Encrypt Wallet
          </label>
          <div className="pt-2">
            <h3 className="font-semibold mb-1">Advanced Options</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={disableKeys}
                onChange={(e) => setDisableKeys(e.target.checked)}
              />
              Disable Private Keys
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={blank}
                onChange={(e) => setBlank(e.target.checked)}
              />
              Make Blank Wallet
            </label>
            <label className="flex items-center gap-2 opacity-50">
              <input type="checkbox" disabled /> External signer
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border border-slate-400 bg-slate-200 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled
              className="px-3 py-1 border border-slate-400 bg-slate-300 text-slate-600 cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
