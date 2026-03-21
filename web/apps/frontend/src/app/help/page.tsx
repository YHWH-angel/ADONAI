'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLocaleStore } from '@/hooks/useLocale';
import {
  HelpCircle,
  Wallet,
  Layers,
  ArrowRightLeft,
  Pickaxe,
  Shield,
  BookOpen,
  Coins,
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Content ─────────────────────────────────────────────────────────────────

const content = {
  es: {
    pageTitle: 'Centro de Ayuda',
    pageSubtitle: 'Todo lo que necesitas saber sobre ADONAI y las criptomonedas, explicado de forma sencilla.',
    sections: [
      {
        icon: Coins,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        title: '¿Qué es ADONAI?',
        body: 'ADONAI (ADO) es una criptomoneda independiente. Piensa en ella como el euro o el dólar, pero completamente digital y sin ningún banco ni gobierno detrás. Las transacciones ocurren directamente entre personas, en cualquier parte del mundo, las 24 horas del día.',
      },
      {
        icon: Layers,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        title: '¿Qué es una blockchain?',
        body: 'La blockchain es como un libro de cuentas gigante y público que registra cada transacción. Está repartido entre miles de ordenadores del mundo, por lo que nadie lo controla y nadie puede borrarlo ni modificarlo. Cada página del libro se llama "bloque" y todos los bloques están encadenados entre sí.',
      },
      {
        icon: Wallet,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        title: '¿Qué es una wallet?',
        body: 'Una wallet (billetera) es como tu cuenta bancaria personal, pero tú tienes el control total. No hay banco que pueda bloquearte o congelarte los fondos. Contiene tus claves privadas, que son las que demuestran que los ADO son tuyos. ¡Guárdalas bien y nunca las compartas!',
      },
      {
        icon: Globe,
        color: 'text-teal-500',
        bg: 'bg-teal-500/10',
        title: '¿Cómo recibo ADO?',
        body: 'Cada wallet tiene una dirección única, parecida a un número de cuenta bancaria (empieza por "ad1..."). Para recibir ADO simplemente comparte tu dirección con la persona que quiere enviarte fondos. Puedes generar nuevas direcciones en la sección "Recibir" de esta app.',
      },
      {
        icon: ArrowRightLeft,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        title: '¿Cómo envío ADO?',
        body: 'Para enviar ADO necesitas la dirección del destinatario y especificar la cantidad. La app calculará automáticamente una pequeña comisión por el uso de la red. Una vez confirmada la transacción, los fondos llegan en segundos o minutos sin importar dónde esté el destinatario.',
      },
      {
        icon: Pickaxe,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        title: '¿Qué es el minado?',
        body: 'Los mineros son ordenadores que "trabajan" para validar y registrar las transacciones en la blockchain. ADONAI usa el algoritmo BLAKE3 para este trabajo. Como recompensa por su trabajo, el minero que consigue "minar" un bloque recibe 18 ADO nuevos. Es la forma en que se crean nuevas monedas.',
      },
      {
        icon: Shield,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        title: '¿Es seguro?',
        body: 'Sí. Cada transacción está protegida por criptografía de curva elíptica (secp256k1), la misma que usa Bitcoin. Una vez confirmada en la blockchain, una transacción es prácticamente imposible de revertir o falsificar. Tu seguridad depende sobre todo de mantener tu clave privada y frase semilla en secreto.',
      },
    ],
    glossaryTitle: 'Glosario',
    glossarySubtitle: 'Términos clave explicados',
    glossary: [
      { term: 'ADO', def: 'La moneda nativa de la red ADONAI. Símbolo: ADO.' },
      { term: 'Blockchain', def: 'Cadena de bloques: registro público e inmutable de todas las transacciones.' },
      { term: 'Wallet', def: 'Aplicación o dispositivo que guarda tus claves y te permite enviar/recibir ADO.' },
      { term: 'Dirección', def: 'Identificador público de tu wallet (como un número de cuenta). Empieza por "ad1...".' },
      { term: 'Bloque', def: 'Agrupación de transacciones añadida a la blockchain cada ~45 segundos.' },
      { term: 'Hash', def: 'Huella digital única de un bloque o transacción, generada por el algoritmo BLAKE3.' },
      { term: 'Confirmación', def: 'Cada bloque minado encima de tu transacción aumenta su seguridad en 1 confirmación.' },
      { term: 'Comisión', def: 'Pequeña cantidad de ADO pagada a los mineros por procesar tu transacción.' },
    ],
  },

  en: {
    pageTitle: 'Help Center',
    pageSubtitle: 'Everything you need to know about ADONAI and cryptocurrency, explained simply.',
    sections: [
      {
        icon: Coins,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        title: 'What is ADONAI?',
        body: 'ADONAI (ADO) is an independent cryptocurrency. Think of it like the euro or dollar, but fully digital with no bank or government behind it. Transactions happen directly between people, anywhere in the world, 24 hours a day.',
      },
      {
        icon: Layers,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        title: 'What is a blockchain?',
        body: 'The blockchain is like a giant public ledger that records every transaction. It is spread across thousands of computers worldwide, so nobody controls it and nobody can delete or alter it. Each page of the ledger is called a "block" and all blocks are chained together.',
      },
      {
        icon: Wallet,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        title: 'What is a wallet?',
        body: 'A wallet is like your personal bank account, but you are in full control. No bank can block or freeze your funds. It holds your private keys — the proof that your ADO belong to you. Keep them safe and never share them!',
      },
      {
        icon: Globe,
        color: 'text-teal-500',
        bg: 'bg-teal-500/10',
        title: 'How do I receive ADO?',
        body: 'Every wallet has a unique address, similar to a bank account number (it starts with "ad1..."). To receive ADO, simply share your address with the sender. You can generate new addresses in the "Receive" section of this app.',
      },
      {
        icon: ArrowRightLeft,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        title: 'How do I send ADO?',
        body: 'To send ADO you need the recipient\'s address and the amount. The app automatically calculates a small network fee. Once confirmed, funds arrive in seconds or minutes regardless of where the recipient is located.',
      },
      {
        icon: Pickaxe,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        title: 'What is mining?',
        body: 'Miners are computers that "work" to validate and record transactions on the blockchain. ADONAI uses the BLAKE3 algorithm for this. As a reward for their work, the miner that successfully mines a block receives 18 new ADO. This is how new coins are created.',
      },
      {
        icon: Shield,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        title: 'Is it safe?',
        body: 'Yes. Every transaction is protected by elliptic-curve cryptography (secp256k1), the same used by Bitcoin. Once confirmed on the blockchain, a transaction is practically impossible to reverse or forge. Your security mainly depends on keeping your private key and seed phrase secret.',
      },
    ],
    glossaryTitle: 'Glossary',
    glossarySubtitle: 'Key terms explained',
    glossary: [
      { term: 'ADO', def: 'The native currency of the ADONAI network. Symbol: ADO.' },
      { term: 'Blockchain', def: 'Chain of blocks: a public, immutable record of all transactions.' },
      { term: 'Wallet', def: 'App or device that holds your keys and lets you send/receive ADO.' },
      { term: 'Address', def: 'Public identifier for your wallet (like an account number). Starts with "ad1...".' },
      { term: 'Block', def: 'A batch of transactions added to the blockchain every ~45 seconds.' },
      { term: 'Hash', def: 'A unique digital fingerprint of a block or transaction, generated by BLAKE3.' },
      { term: 'Confirmation', def: 'Each block mined on top of your transaction increases its security by 1 confirmation.' },
      { term: 'Fee', def: 'A small amount of ADO paid to miners for processing your transaction.' },
    ],
  },
} as const;

// ─── Accordion item ───────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  body: string;
}

function AccordionSection({ icon: Icon, color, bg, title, body }: SectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card
      className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
            <Icon size={20} className={color} strokeWidth={1.8} />
          </div>
          <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
          {open ? (
            <ChevronUp size={16} className="shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
          )}
        </div>
        {open && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const { locale } = useLocaleStore();
  const t = content[locale];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <HelpCircle size={24} className="text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {t.sections.map((section) => (
          <AccordionSection
            key={section.title}
            icon={section.icon}
            color={section.color}
            bg={section.bg}
            title={section.title}
            body={section.body}
          />
        ))}
      </div>

      {/* Glossary */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" strokeWidth={1.8} />
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.glossaryTitle}</h2>
            <p className="text-xs text-muted-foreground">{t.glossarySubtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {t.glossary.map(({ term, def }) => (
            <Card key={term} className="overflow-hidden">
              <CardContent className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <Key size={14} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.8} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{term}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{def}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
