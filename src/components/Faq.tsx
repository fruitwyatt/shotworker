interface Item {
  q: string;
  a: string;
}

export default function Faq({ items }: { items: Item[] }) {
  return (
    <div className="faq">
      {items.map((it) => (
        <details key={it.q} className="faq-item">
          <summary>{it.q}</summary>
          <p>{it.a}</p>
        </details>
      ))}
    </div>
  );
}
