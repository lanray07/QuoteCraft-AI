interface AssumptionsListProps {
  assumptions: string[];
}

export function AssumptionsList({ assumptions }: AssumptionsListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Assumptions used</h3>
      </div>
      <ul className="bullet-list">
        {assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>
    </section>
  );
}
