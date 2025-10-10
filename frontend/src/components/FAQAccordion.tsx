'use client';
import { useState } from 'react';

type FAQ = { q: string; a: React.ReactNode };

export default function FAQList({ items = defaultItems }: { items?: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(null); // open #2 by default

  const isOpen = (i: number) => open === i;
  const toggle = (i: number) => setOpen(prev => (prev === i ? null : i));

  return (
    <section className="mx-auto w-full px-15 max-w-3xl border-y border-gray-200 divide-y divide-gray-200">
      {items.map((item, i) => (
        <div key={i}>
          {/* Entire row is clickable */}
          <button
            type="button"
            onClick={() => toggle(i)}
            aria-expanded={isOpen(i)}
            aria-controls={`faq-panel-${i}`}
            id={`faq-trigger-${i}`}
            className="flex w-full items-center justify-between py-4 text-left
                       cursor-pointer hover:bg-gray-50 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300 font-calluna"
          >
            <span className="text-gray-900 text-[17px]">{item.q}</span>
            <svg
              className={`h-5 w-5 shrink-0 text-gray-700 transition-transform ${isOpen(i) ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
            >
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
            </svg>
          </button>

          {/* Only render the answer when open*/}
            <div
              role="region"
              aria-labelledby={`faq-trigger-${i}`}
              className={[
                // animation (height collapse + fade + drop), and text formatting:
                'overflow-hidden transition-[max-height,opacity,transform,padding] duration-300 ease-out',
                'text-sm leading-relaxed text-gray-600 font-calluna',
                // toggle states:
                isOpen(i) ? 'max-h-[1000px] opacity-100 translate-y-0 py-4' : 'max-h-0 opacity-0 -translate-y-2 py-0',
              ].join(' ')}
              >
                {item.a}
            </div>
        </div>
      ))}
    </section>
  );
}

const defaultItems: FAQ[] = [
  { q: 'Can I order books online?', a: <>Yes! You can browse and purchase books through our online store.</> },
  { q: 'How do I pick up my online order?', a: <>Once your order is ready, we’ll notify you. Pickups are in-store only during open hours.</> },
  { q: 'Do you offer shipping?', a: <>No, we do not offer shipping. All orders must be picked up in person.</> },
  { q: 'Can someone else pick up my order for me?', a: <>Yes, just have them bring your name and order confirmation.</> },
  { q: 'How long will my order be held for in-store pickup?', a: <>We’ll hold your order for up to 14 days after it’s ready.</> },
  { q: 'How will I know when my order is ready for pickup?', a: <>You’ll receive an email from us once your order is prepared and available.</> },

  { q: 'Do you offer refunds or exchanges?', a: <>No, all sales are final. We cannot accept returns or exchanges.</> },
  { q: 'What if I receive the wrong item or a damaged book?', a: <>Please reach out to us as soon as possible. We’ll do our best to make it right.</> },
  { q: 'Can I cancel or modify my order after placing it?', a: <>Unfortunately, we’re unable to cancel or modify orders once placed.</> },

  { q: 'Is your full catalog available online?', a: <>Our online store features most of our available stock, but some items may only be in-store.</> },
  { q: 'Can I reserve a book before visiting the store?', a: <>Yes! You can reserve by placing an order online for in-store pickup.</> },
  { q: 'Do you restock items that are sold out?', a: <>Sometimes. Due to limited stock and small-scale operations, not all titles are restocked.</> },
  { q: 'Can I request or special order a book not listed?', a: <>We can’t guarantee special orders, but feel free to email us—we’ll see what we can do.</> },

  { q: 'Where is Groundwork Books located?', a: <>We’re located on the UC San Diego campus, near the Old Student Center.</> },
  { q: 'What are your hours of operation?', a: <>Our hours vary seasonally. Please check our homepage or social media for current times.</> },
  { q: 'Can I hang out in the store even if I’m not buying anything?', a: <>Absolutely! Everyone is welcome to sit, study, relax, or chat.</> },
  { q: 'Do you have a quiet space for studying or reading?', a: <>Yes, we offer a cozy and calm space open to all.</> },
  { q: 'Is Groundwork Books accessible for people with disabilities?', a: <>Yes. We aim to keep our space accessible, and we’re happy to accommodate where possible.</> },

  { q: 'How can I get involved or volunteer?', a: <>Stop by the store or email us! No experience needed—just an interest in collective work.</> },
  { q: 'Do I have to be a UCSD student to visit or volunteer?', a: <>Not at all. We’re open to the broader community, not just UCSD students.</> },
  { q: 'Do you host events or teach-ins?', a: <>Yes! We host teach-ins, study sessions, and events on radical topics year-round.</> },
  { q: 'Can I distribute my zine or pamphlet through Groundwork?', a: <>Yes! Bring a copy to the store or contact us. We love sharing community publications.</> },

  { q: 'What is the Groundwork Books Collective?', a: <>We’re a non-profit, non-hierarchical bookstore and community space founded in 1973.</> },
  { q: 'What does it mean to be a non-hierarchical workers’ cooperative?', a: <>It means we operate collectively—decisions are made together, without bosses.</> },
  { q: 'What kinds of literature do you focus on?', a: <>We carry leftist books on theory, philosophy, feminism, abolition, art, and more.</> },
  { q: 'Why don’t you offer shipping or returns?', a: <>As a small, volunteer-run co-op, we focus on sustainability and in-person community support.</> },
  { q: 'How is Groundwork different from other bookstores?', a: <>We’re a radical community space, run collectively, grounded in social justice and mutual aid.</> },
];

