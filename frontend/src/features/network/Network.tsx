import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import type { Block, MempoolTx, Peer } from '@/store/types'
import './network.css'

export default function Network() {
  const { t } = useTranslation()
  const { peers, mempool, blocks, setPeers, setMempool, setBlocks } =
    useAppStore((s) => ({
      peers: s.peers,
      mempool: s.mempool,
      blocks: s.blocks,
      setPeers: s.setPeers,
      setMempool: s.setMempool,
      setBlocks: s.setBlocks,
    }))

  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [selectedTx, setSelectedTx] = useState<MempoolTx | null>(null)

  useEffect(() => {
    fetch('/api/peers')
      .then((r) => r.json())
      .then((d: Peer[]) => setPeers(d))
      .catch(() => {})
    fetch('/api/mempool')
      .then((r) => r.json())
      .then((d: MempoolTx[]) => setMempool(d))
      .catch(() => {})
    fetch('/api/blocks')
      .then((r) => r.json())
      .then((d: Block[]) => setBlocks(d))
      .catch(() => {})
  }, [setPeers, setMempool, setBlocks])

  return (
    <div className="network">
      <section className="peers">
        <h2>{t('peers')}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('address')}</th>
              <th>{t('ping')}</th>
              <th>{t('type')}</th>
            </tr>
          </thead>
          <tbody>
            {peers.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.address}</td>
                <td>{p.ping}</td>
                <td>{p.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mempool">
        <h2>{t('mempool')}</h2>
        <ul>
          {mempool.slice(0, 5).map((tx) => (
            <li key={tx.txid}>
              <button onClick={() => setSelectedTx(tx)}>{tx.txid}</button>
            </li>
          ))}
        </ul>
      </section>
      <section className="blocks">
        <h2>{t('recentBlocks')}</h2>
        <ul>
          {blocks.map((b) => (
            <li key={b.hash}>
              <button onClick={() => setSelectedBlock(b)}>
                {b.height}: {b.hash}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {selectedBlock && (
        <div className="details">
          <h3>
            {t('blockDetails')} {selectedBlock.height}
          </h3>
          <button onClick={() => setSelectedBlock(null)}>{t('back')}</button>
          <p>Hash: {selectedBlock.hash}</p>
          <ul>
            {selectedBlock.txs.map((txid) => (
              <li key={txid}>
                <button onClick={() => setSelectedTx({ txid })}>{txid}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedTx && (
        <div className="details">
          <h3>{t('txDetails')}</h3>
          <button onClick={() => setSelectedTx(null)}>{t('back')}</button>
          <p>
            {t('txid')}: {selectedTx.txid}
          </p>
        </div>
      )}
    </div>
  )
}
