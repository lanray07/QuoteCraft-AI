interface UpsellSuggestionsProps {
  items: string[];
}

export function UpsellSuggestions({ items }: UpsellSuggestionsProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Suggested upsells</h3>
      </div>
      <ul className="bullet-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
